import re
import database_models

Users = database_models.Users
class Valid():
	USER_RE = re.compile("^[a-zA-Z0-9_-]{3,20}$")
	PASS_RE = re.compile("^.{3,20}$")
	EMAIL_RE = re.compile("^[\S]+@[\S]+.[\S]+$")
	@classmethod
	def username(self, username):
		return self.USER_RE.match(username)

	@classmethod
	def password(self, password):
		return self.PASS_RE.match(password)

	@classmethod
	def email(self, email):
		return self.EMAIL_RE.match(email)

	@classmethod
	def user_exists(self, username):
		user = Users.query().filter(Users.user == username).get()
		if user:
			return user
		else:
			return False