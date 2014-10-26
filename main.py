import webapp2
from jinja2 import Environment, FileSystemLoader
from os.path import dirname, join
import os
import json
from jinja2 import Environment, FileSystemLoader

import numpy as np
import PIL
import matplotlib.pyplot as plt
import Image
from lib_db import SeismicObject, PickrParent

import base64

import StringIO
from google.appengine.api import users

# Jinja2 environment to load templates
env = Environment(loader=FileSystemLoader(join(dirname(__file__),
                                               'templates')))

db_parent = PickrParent.all().get()
if not db_parent:
    db_parent = PickrParent()
    db_parent.put()

class MainPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()

        if not user:
      


            url = users.create_login_url('/')
            template = env.get_template("main.html")

            html = template.render(login_url=url)
            self.response.out.write(html)

        else:
            # Load the main page welcome page
            self.redirect('/pickr')
            

class ResultsHandler(webapp2.RequestHandler):

    def get(self):

        data = SeismicObject().all().fetch(1000)
        
        fig = plt.figure(figsize=(15,8))
        ax = fig.add_axes([0.1,0.1,0.8,0.8])
        
        # Load the image to a variable
        im = Image.open('Alaska.png')
        
        # plot the seismic image first
        im = plt.imshow(im)
       
        for user in data:
            picks = np.array(json.loads(user.picks))
            ax.plot(picks[:,0], picks[:,1],'g-+', alpha=0.5, lw=3.0)
        
        ax.set_xlim(0,1000)
        ax.set_ylim(0,600)
        ax.invert_yaxis()
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_frame_on(False)

        output = StringIO.StringIO()
        plt.savefig(output)

        template = env.get_template("results.html")
        html = template.render(image=base64.b64encode(output.getvalue()))
        self.response.write(html)

        # Make composite image
class AboutHandler(webapp2.RequestHandler):

    def get(self):

        # Load the main page welcome page
        template = env.get_template('about.html')
        self.response.write(template.render())

class PickerHandler(webapp2.RequestHandler):

    def get(self):

        template = env.get_template('pickpoint.html')

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
        
        

class PickHandler(webapp2.RequestHandler):

    def get(self):

        user = users.get_current_user()
        if self.request.get("user_picks"):
            data = SeismicObject.all().filter("user =", user).get()

            self.response.write(data.picks)
            return
        if self.request.get("all"):
            data = SeismicObject.all().fetch(1000)

            picks = [i.picks for i in data]
            self.response.write(data)
            return

    def post(self):

        point = (int(self.request.get("x")),
                 int(self.request.get("y")))

        user = users.get_current_user()

        if not user:
            self.redirect('/')

        d = SeismicObject.all().ancestor(db_parent).filter("user =",
                                                           user).get()

        if not d:
            d = SeismicObject(picks=json.dumps([point]).encode(),
                              user=user, parent=db_parent)
            d.put()
        else:

            picks = json.loads(d.picks)
            picks.append(point)
            d.picks = json.dumps(picks).encode()
            d.put()
        self.response.write("Ok")


    def delete(self):

        user = users.get_current_user()

        data = \
          SeismicObject.all().ancestor(db_parent).filter("user =",
                                                         user).get()

        points = json.loads(data.picks)

        if self.request.get("clear"):
            points = []
            value = points
            
        elif self.request.get("undo"):
            
            value = points.pop()
            
        data.picks = json.dumps(points).encode()

        data.put()
        self.response.write(json.dumps(value))


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
    ('/update_pick', PickHandler),
    ('/pickr', PickerHandler),
    ('/results', ResultsHandler)],
    debug=True)
