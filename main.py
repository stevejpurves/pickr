import webapp2
from jinja2 import Environment, FileSystemLoader
from os.path import dirname, join
import os

from jinja2 import Environment, FileSystemLoader

# Jinja2 environment to load templates
env = Environment(loader=FileSystemLoader(join(dirname(__file__),
                                               'templates')))

class MainPage(webapp2.RequestHandler):
    def get(self):

        # Load the main page welcome page
        template = env.get_template('main.html')
        self.response.write(template.render())


class AboutHandler(webapp2.RequestHandler):

    def get(self):

        # Load the main page welcome page
        template = env.get_template('about.html')
        self.response.write(template.render())

        
class UploadModel(webapp2.RequestHandler):
    pass
    
app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/upload', UploadModel),
    ('/about', AboutHandler)
], debug=True)
