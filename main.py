# Blog Site
# Created By: Tim
# Credits to Udacity Full Stack Web Developer Course

import webapp2
import jinja2
import os
import codecs
import re
import cookieStuff
import hashpass
import json
import database_models
import Valid

Valid = Valid.Valid
Blogs = database_models.Blogs
Likes = database_models.Likes
Comments = database_models.Comments
Users = database_models.Users

from google.appengine.api import images


template_dir = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir),
											autoescape = True)

class Handler(webapp2.RequestHandler):
	def write(self, *a, **kw):
		self.response.out.write(*a, **kw)

	def render_str(self, template, **params):
		t = jinja_env.get_template(template)
		return t.render(params)

	def render(self, template, **kw):
		self.write(self.render_str(template, **kw))

	def user_set(self, redirect = True):
		user_cookie = self.request.cookies.get('user_id')
		user = False
		if user_cookie:
			user = cookieStuff.check_secure_val(user_cookie)
			if user:
				user_exists = Users.query();
				user_exists = user_exists.filter(Users.user == user)
				if user_exists is not None:
					return user	
		if not user and redirect:
			self.redirect("/login")
		return user


class imageHandler(Handler):
	def post(self):
		delete_image = self.request.get('delete_image')
		blog_id = self.request.get('blog_id')
		image = self.request.get('img')

		blog = Blogs.get_by_id(int(blog_id))


		if blog.created_by == self.user_set(False):
			if delete_image:
				blog.image = None
				blog.put()
			else:
				image = images.resize(image, 500,500)
				blog.image = image
				blog.put()


class Image(Handler):
	def get(self):
		blog = Blogs.get_by_id(int(self.request.get('img_id')))
		if blog.image:
			self.response.headers['Content-Type'] = 'image/jpeg'
			self.write(blog.image)
		else:
			self.write('No Image')


class signupHandler(Handler):
	def get(self):
		self.render('signup.html',
		user = False,
		page_title = "Sign Up")
	def post(self):
		username= self.request.get('username')
		password= self.request.get('password')
		verify= self.request.get('verify')
		email= self.request.get('email')
		userError = ""
		passError = ""
		emailError = ""
		verifyError = ""
		hasError = False

		if not Valid.username(username):
			userError = "Username is not Valid"
			hasError = True

		if not Valid.password(password):
			passError = "Password Not Valid"
			hasError = True

		if email and not Valid.email(email):
			emailError = "Email Not Valid"
			hasError = True

		if password != verify:
			verifyError = "Passwords Do not Match"
			hasError = True

		if Valid.user_exists(username):
			userError = "Username already exists"
			hasError = True

		if not hasError:
			password = hashpass.make_pw_hash(username, password)
			u = Users(user = username, password = password, email = email)
			u.put()
			value = cookieStuff.make_secure_val(username)
			self.response.headers.add_header(
				'Set-Cookie',
				str('user_id=%s; Path=/' % value))
			self.redirect("/welcome")

		self.render(
			"signup.html",
			userError = userError,
			passError = passError,
			emailError = emailError,
			verifyError = verifyError,
			user = False,
			page_title = "Sign Up")



class bloglistHandler(Handler):
	def get(self):
		user_id = self.request.get('user_id')
		user = self.user_set(False)
		if user_id:
			blogs = Blogs.query()
			blogs = blogs.filter(Blogs.created_by == user_id)
			blogs = blogs.order(-Blogs.created)
			page_title = user_id + "'s Blogs"
		else:
			blogs = Blogs.query().order(-Blogs.created)
			page_title = "Latest Blogs"
		
		likes_for_page = Likes.generate_likes_list(user,blogs)
		error = ''
		self.render(
			'bloglist.html',
			blogs = blogs,
			likes_for_page = likes_for_page,
			error = error,
			liked_idx = 0,
			user = user,
			page_title = page_title)


class blogHandler(Handler):
	def get(self, blogID):
		blog = Blogs.get_by_id(int(blogID))
		user = self.user_set(False)
		comments = Comments.query()
		comments = comments.filter(Comments.parent_blog == int(blogID))
		comments = comments.order(Comments.created)
		self.render(
			'blog.html',
			blog = blog,
			user = user,
			comments = comments,
			page_title = blog.subject)
	

class editpostHandler(Handler):
	def get(self, blog_id):		
		user = self.user_set()
		error = ''		
		if Blogs.blog_exists(int(blog_id)) and user:
			blog = Blogs.get_by_id(int(blog_id))
			page_title = 'Edit ' + blog.subject	
			if user and user == blog.created_by:
				self.render(
					'editBlog.html',
					user = user,
					blog = blog,
					error = error,
					page_title = page_title)
			else:
				self.redirect('/')
	
	def post(self, blog_id):		
		user = self.user_set()
		subject = self.request.get('subject')
		content = self.request.get('content')
		if Blogs.blog_exists(int(blog_id)) and user:
			blog = Blogs.get_by_id(int(blog_id))
			page_title = 'Edit ' + blog.subject
			if user == blog.created_by and Blogs.blog_exists(int(blog_id)):
				if subject and content:
					blog.subject = subject
					blog.content = content
					blog.put()
					error = 'You have edited your blog!'
				else:
					error = 'You need to have a Subject and Content to your blog!'
			else:
				self.redirect('/')
				return
			self.render(
				'editBlog.html',
				user = user,
				blog = blog,
				error = error,
				page_title = page_title)
		else:
			self.redirect('/')

class deletepostHandler(Handler):
	def post(self, blog_id):
		user = self.user_set()
		blog_exists = Blogs.blog_exists(int(blog_id))
		if user and blog_exists:
			blog = Blogs.get_by_id(int(blog_id))
			if user == blog.created_by:
				comments = Comments.query()
				comments = comments.filter(Comments.parent_blog == int(blog_id))
				likes = Likes.query().filter(Likes.blog_id == int(blog_id))
				for comment in comments:
					comment.key.delete()
				for like in likes:
					like.key.delete()
				blog.key.delete()
		self.redirect('/')

class newpostHandler(Handler):
	def get(self):
		user = self.user_set()
		self.render(
			'newpost.html',
			error = '',
			subject = '',
			content = '',
			user = user,
			page_title = 'New Post')

	def post(self):
		user = self.user_set()
		subject = self.request.get('subject')
		content = self.request.get('content')

		if subject and content and user:
			b = Blogs(
				subject = subject,
				content = content,
				created_by = user,
				num_likes = 0,
				num_comments = 0)
			b.put()
			self.redirect('/%s'%b.key.id())
		else:
			error = "We need both a title and blog entry"
			self.render(
				'newpost.html',
				subject = subject,
				content = content,
				error = error,
				user = user,
				page_title = 'New Post')

class welcomeHandler(Handler):
	def get(self):
		user = self.user_set()
		self.redirect("/newpost")

class loginHandler(Handler):
	def get(self):
		self.render(
			"login.html",
			loginError = "",
			page_title = "Log In")
	def post(self):
		username = self.request.get('username')
		password = self.request.get('password')
		user = Valid.user_exists(username)
		if user and hashpass.valid_pw(username, password, user.password):
			value = cookieStuff.make_secure_val(username)
			self.response.headers.add_header('Set-Cookie',
							str('user_id=%s; Path=/' % value))
			self.redirect("/welcome")
		else:
			loginError = "Incorrect Login"
			self.render(
				"login.html",
				loginError = loginError,
				page_title = "Log In")

class logoutHandler(Handler):
	def get(self):
		self.response.headers.add_header(
			'Set-Cookie',
			str('user_id=; Path=/'))
		self.redirect("/login")

class likesHandler(Handler):
	def post(self):
		blogs = Blogs.query().order(-Blogs.created)
		user = self.user_set(False)
		liked_idx = self.request.get('blog_idx')
		blog_id = self.request.get('blog_id')
		liked_blog = Blogs.get_by_id(int(blog_id))
		liked = Likes.already_liked(user, int(blog_id))
		net_like = 0
		if Blogs.blog_exists(int(blog_id)):	
			if user == liked_blog.created_by:
				error = 'You cannot like your own post!'
			elif not user:
				error = 'You must be signed in to like someones post!'
			elif liked:
				error = 'You have unliked this post!'
				liked.get().key.delete()
				liked_blog.num_likes -= 1
				liked_blog.put()
				net_like = -1

			else:
				l = Likes(user = user, blog_id = int(blog_id))
				l.put()
				liked_blog.num_likes += 1
				liked_blog.put()
				error = 'You have liked this post!'
				net_like = 1

		json_response = {
			'error': error,
			'net_like': net_like,
			'num_likes': liked_blog.num_likes
		}
		self.write(json.dumps(json_response))


class addCommentHandler(Handler):
	def post(self):
		blog_id = self.request.get('blog_id')
		user = self.user_set(False)
		comment_id = self.request.get('comment_id')
		comment_text = self.request.get('comment_text')

		if user and comment_text and Blogs.blog_exists(int(blog_id)):
			blog = Blogs.get_by_id(int(blog_id))
			c = Comments(
				content = comment_text, 
				user = user, 
				parent_blog = int(blog_id))
			c.put()
			blog.num_comments += 1
			blog.put()
			json_response = {
				'error': 'Thanks for adding a comment!',
				'user': user,
				'ret_val': True,
				'comment_id': c.key.id()
			}
			self.write(json.dumps(json_response))
		elif not user:
			json_response = {
			'error': 'You must be signed in to add a comment',
			'ret_val': False
			}
			self.write(json.dumps(json_response))
		elif not comment_text:
			json_response = {
			'error': 'You cannot add a blank comment',
			'ret_val': False
			}
			self.write(json.dumps(json_response))

class updateCommentHandler(Handler):
	def post(self):
		user = self.user_set(False)
		comment_id = self.request.get('comment_id')
		comment_text = self.request.get('comment_text')
		if Comments.comment_exists(int(comment_id)):
			comment = Comments.get_by_id(int(comment_id))
			if comment and user == comment.user and comment_text:
				comment.content = comment_text
				comment.put()
				json_response = {
					'error': 'Thanks for updating the comment!',
					'user': user,
					'ret_val': True,
					'comment_content': comment_text,
					'comment_id': comment.key.id()
				}
				self.write(json.dumps(json_response))
			else:
				json_response = {
					'error': 'There was an error!',
					'ret_val': False,
				}
				self.write(json.dumps(json_response))

class deleteCommentHandler(Handler):
	def post(self):
		blog_id = self.request.get('blog_id')
		user = self.user_set(False)
		comment_id = self.request.get('comment_id')
		blog_exists = Blogs.blog_exists(int(blog_id))
		comment_exists = Comments.comment_exists(int(comment_id))
		if user and comment_exists and blog_exists:
			comment = Comments.get_by_id(int(comment_id))
			blog = Blogs.get_by_id(int(blog_id))
			if user == comment.user or user == blog.created_by:
				comment.key.delete()
				blog.num_comments -= 1
				blog.put()
				return

app = webapp2.WSGIApplication([
		('/', bloglistHandler),
		('/(\d+)', blogHandler),
		('/(\d+)/edit', editpostHandler),
		('/(\d+)/delete', deletepostHandler),
		('/newpost', newpostHandler),
		('/signup', signupHandler),
		('/welcome', welcomeHandler),
		('/login', loginHandler),
		('/logout', logoutHandler),
		('/likes', likesHandler),
		('/addcomment', addCommentHandler),
		('/deletecomment', deleteCommentHandler),
		('/updatecomment', updateCommentHandler),
		('/img', Image),
		('/images', imageHandler),
	], debug=True)