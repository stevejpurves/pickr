import webapp2
from jinja2 import Environment, FileSystemLoader
from os.path import dirname, join
import os
import json
from jinja2 import Environment, FileSystemLoader

from lib_db import SeismicObject

from google.appengine.api import users

# Jinja2 environment to load templates
env = Environment(loader=FileSystemLoader(join(dirname(__file__),
                                               'templates')))

class MainPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()

        if not user:
            greeting = ('<a href="%s">Sign in or register</a>.' %
                        users.create_login_url('/'))

            self.response.out.write('<html><body>%s</body></html>' % greeting)

        else:
            # Load the main page welcome page
            self.redirect('/static/html/pickpoint.html')
            


class AboutHandler(webapp2.RequestHandler):

    def get(self):

        # Load the main page welcome page
        template = env.get_template('about.html')
        self.response.write(template.render())


## class UploadHandler(blobstore_handlers.BlobstoreUploadHandler,
##                     webapp2.RequestHandler):

##     def post(self):

##         upload_file = self.get_uploads()
##         blob_info = upload_files[0]

##         # Read the image file
##         reader = blobstore.BlobReader(blob_info.key())

##         im = Image.open(reader, 'r')
##         im = im.convert('RGB').resize((350,350))

##         output = StringIO.StringIO()
##         im.save(output, format='PNG')

##         bucket = '/pickr_bucket/'
##         output_filename = (bucket +'/2' + str(time.time()))

##         gcsfile = gcs.open(output_filename, 'w')
##         gcsfile.write(output.getvalue())

##         output.close()
##         gcsfile.close()

##         # Make a blob reference
##         bs_file = '/gs' + output_filename
##         output_blob_key = blobstore.create_gs_key(bs_file)

##         name = self.request.get("name")
##         description = self.request.get("description")

##         new_db = SeismicObject(name=name, description=description,
##                                image=output_blob_key)

##         new_db.put()

##         self.redirect('/')
        
        

class UpdatePick(webapp2.RequestHandler):

    def post(self):

        point = (int(self.request.get("x")),
                 int(self.request.get("y")))

        user = users.get_current_user()

        if not user:
            self.redirect('/')

        d = SeismicObject.all().filter("user =", user).get()

        if not d:
            d = SeismicObject(picks=json.dumps([point]).encode(),
                              user=user)
            d.put()
        else:

            picks = json.loads(d.picks)
            picks.append(point)
            print "PICKS", picks
            d.picks = json.dumps(picks).encode()
            d.put()
        self.response.write("Ok")
        
## class AddImageHandler(webapp2.RequestHandler):

##     def get(self):

##         upload_url = blobstore.create_upload_url('/upload')

##         template = env.get_template("new_image.html")

##         html = template.render(upload_url=upload_url))
##         self.response.write(html)
    
app = webapp2.WSGIApplication([
    ('/', MainPage),
    #('/upload', UploadModel),
    ('/about', AboutHandler),
    #('/new_image', AddImageHandler),
    ('/update_pick', UpdatePick)],
    debug=True)
