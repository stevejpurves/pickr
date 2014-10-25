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


class UploadHandler(blobstore_handlers.BlobstoreUploadHandler,
                    webapp2.RequestHandler):

    def post(self):

        upload_file = self.get_uploads()
        blob_info = upload_files[0]

        # Read the image file
        reader = blobstore.BlobReader(blob_info.key())

        im = Image.open(reader, 'r')
        im = im.convert('RGB').resize((350,350))

        output = StringIO.StringIO()
        im.save(output, format='PNG')

        bucket = '/pickr_bucket/'
        output_filename = (bucket +'/2' + str(time.time()))


        gcsfile = gcs.open(output_filename, 'w')
        gcsfile.write(output.getvalue())

        output.close()
        gcsfile.close()

        # Make a blob reference
        bs_file = '/gs' + output_filename
        output_blob_key = blobstore.create_gs_key(bs_file)

        name = self.request.get("name")
        description = self.request.get("description")

        new_db = SeismicObject(name=name, description=description,
                               image=output_blob_key)

        new_db.put()

        self.redirect('/')
        
        

class UpdatePick(webapp2.RequestHandler):

    def post(self):

        point = self.request.get("point")
        self.response.write("Ok")
        
class AddImageHandler(webapp2.RequestHandler):

    def get(self):

        upload_url = blobstore.create_upload_url('/upload')

        template = env.get_template("new_image.html")

        html = template.render(upload_url=upload_url))
        self.response.write(html)
    
app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/upload', UploadModel),
    ('/about', AboutHandler),
    ('/new_image', AddImageHandler),
    ('/update_pick', UpdatePick)],
    debug=True)
