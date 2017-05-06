from google.appengine.ext import ndb as db

class Blogs(db.Model):
	subject = db.StringProperty(required = True)
	content = db.TextProperty(required = True)
	created = db.DateTimeProperty(auto_now_add = True)
	created_by = db.StringProperty(required = True)
	num_likes = db.IntegerProperty(required = True)
	num_comments = db.IntegerProperty()
	image = db.BlobProperty()

	@classmethod
	def blog_exists(cls, blog_id):
		blog = Blogs.get_by_id(blog_id)
		if blog is not None:
			return True
		else:
			return False


class Users(db.Model):
	user = db.StringProperty(required = True)
	password = db.StringProperty(required = True)
	email = db.StringProperty()

	@classmethod
	def by_username(cls, username):
		return cls.query().filter(cls.user == username).get()

class Likes(db.Model):
	user = db.StringProperty(required = True)
	blog_id = db.IntegerProperty(required = True)

	@classmethod
	def already_liked(cls,username,blog_id):
		if not username:
			return False
		find_user_like = cls.query().filter(cls.user == username)
		find_post_like = find_user_like.filter(cls.blog_id == blog_id)
		if find_post_like.get() is None:
			return False
		else:
			return find_post_like

	@classmethod
	def generate_likes_list(cls,user,blogs):
		likes_for_page = []
		for blog in blogs:
			if Likes.already_liked(user,blog.key.id()):
				likes_for_page.append(True)
			else:
				likes_for_page.append(False)
		return likes_for_page

class Comments(db.Model):
	content = db.TextProperty(required = True)
	user = db.StringProperty(required = True)
	parent_blog = db.IntegerProperty(required = True)
	created = db.DateTimeProperty(auto_now_add = True)

	@classmethod
	def comment_exists(cls,comment_id):
		comment = Comments.get_by_id(comment_id)
		if comment is not None:
			return True
		else:
			return False