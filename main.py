import webapp2

from jinja2 import Environment, FileSystemLoader


class MainPage(webapp2.RequestHandler):
    def get(self):

        # Load the main page welcome page
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write('Hello, World!')

        
class UploadModel(webapp2.RequestHandler):
    pass
    
app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/upload', UploadModel)
], debug=True)
