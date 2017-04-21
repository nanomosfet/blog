import re
from google.appengine.ext import db
USER_RE = re.compile("^[a-zA-Z0-9_-]{3,20}$")
def username(username):
	return USER_RE.match(username)

PASS_RE = re.compile("^.{3,20}$")
def password(password):
	return PASS_RE.match(password)

EMAIL_RE = re.compile("^[\S]+@[\S]+.[\S]+$")
def email(email):
	return EMAIL_RE.match(email)

def user_exists(username):
	user = db.Query(Users).filter('user =', username).get()
	if user:
		return user
	else:
		return False