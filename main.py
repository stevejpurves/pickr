import webapp2
from jinja2 import Environment, FileSystemLoader
from os.path import dirname, join
import os
import json
import base64
import hashlib
import StringIO
import time

from google.appengine.api import users
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import blobstore
from google.appengine.api import images

from PIL import Image



# For image serving
import cloudstorage as gcs

import numpy as np
if not os.environ.get('SERVER_SOFTWARE','').startswith('Development'):
    
    import matplotlib.pyplot as plt
    import matplotlib.cm as cm


    local = False
else:
    local = True

from lib_db import ImageObject, SeismicParent, SeismicPicks

# Jinja2 environment to load templates.
env = Environment(loader=FileSystemLoader(join(dirname(__file__),
                                               'templates')))

# Data store set up.
db_parent = SeismicParent.all().get()
if not db_parent:
    db_parent = SeismicParent()
    db_parent.put()


class CommentHandler(webapp2.RequestHandler):

    def get(self):

        index = int(self.request.get("index"))

        data = ImageObject.all().ancestor(db_parent).sort("-date")
        data = data.fetch(1000)[index]

        self.response.write(json.dumps(data.comments))

    def post(self):

        index = int(self.request.get("index"))
        comment = int(self.request.get("comment"))

        data = ImageObject.all().ancestor(db_parent).sort("-date")
        data = data.fetch(1000)[index]
        comments = data.comments
        comments.append(comment)

        data.comments = comments
        data.put()

        self.response.write(comment)

      
class VoteHandler(webapp2.RequestHandler):

    def get(self):
        
        index = int(self.request.get("index"))

        data = ImageObject.all().ancestor(db_parent).order("-date")
        data = data.fetch(1000)[index]

        self.response.write(data.votes)
        
        
    def post(self):

        index = int(self.request.get("index"))
        vote = int(self.request.get("vote"))

        data = ImageObject.all().ancestor(db_parent).order("-date")
        data = data.fetch(1000)[index]


        if vote > 0:
            vote = 1
        else:
            vote =-1
        
        data.votes += vote

        data.put()
        
        self.response.write(data.votes)
 

class MainPage(webapp2.RequestHandler):
    
    def get(self):

        user = users.get_current_user()

        if not user:
            login_url = users.create_login_url('/')
            template = env.get_template("main.html")

            html = template.render(login_url=login_url)
            self.response.out.write(html)

        else:
            logout_url = users.create_logout_url('/')
            login_url = None
            email_hash = hashlib.md5(user.email()).hexdigest()

            self.redirect('/pickr')
            

class ResultsHandler(webapp2.RequestHandler):

    def get(self):

        # connect the dots using one dimensional linear interpretation: np.interp()
        def regularize(xarr, yarr, px, py):
            # connect the dots of the horizon spanning the image
            # px : is the number of horizontal pixels
            # py : is the number of horizontal pixels
            horx = np.arange(px)
            hory = np.interp(horx, xarr, yarr)
            return horx, hory
        
        # append all horizons into one big file
        all_picks_x = np.array([])
        all_picks_y = np.array([])

        image_key = self.request.get("image_key")
        img_obj = ImageObject.get_by_id(int(image_key))
        image_url = images.get_serving_url(img_obj.image)
        
        
        data = SeismicPicks.all().ancestor(img_obj).fetch(1000)
        
        count = len(data)

        if not local:
            
            fig = plt.figure(figsize=(15,8))
            ax = fig.add_axes([0,0,1,1])
        
            # Load the image to a variable
            im = Image.open('brazil_ang_unc.png')
            px, py = im.size
        
            # plot the seismic image first
            # im = plt.imshow(im)
            # Make a modified version of rainbow colormap with some transparency
            # in the bottom of the colormap.
            hot = cm.hot
            hot.set_under(alpha = 0.0)  #anything that has value less than 0.5 goes transparent
            
            for user in data:
                try:
                    picks = np.array(json.loads(user.picks))
                    hx, hy = regularize(picks[:,0], picks[:,1], px, py)
                    all_picks_x = np.concatenate((all_picks_x,hx))
                    all_picks_y = np.concatenate((all_picks_y,hy))
                    ax.plot(picks[:,0], picks[:,1], 'g-', alpha=0.5, lw=2)

                    m = 1
                    # do 2d histogram to display heatmap
                    binsizex = m
                    binsizey = m
                    heatmap, yedges, xedges = np.histogram2d(all_picks_y, all_picks_x,
                                                             bins=(720/binsizex,1080/binsizey),
                                                             range=np.array([[0, 720], [0,1080]]))
                    extent = [0, 1080,
                              720, 0 ]

                    # do dilation of picks in heatmap
                    heatmap_dil = heatmap#grey_dilation(heatmap,size=(5,5))
                
                    #fig = plt.figure(figsize=(15,8))
                    #ax = fig.add_axes([0, 0, 1, 1])
                    #heatim = ax.imshow(heatmap,
                    #                   cmap=cm.hot, extent=extent, alpha=0.75)
                    #heatim.set_clim(0.5, np.amax(heatmap))
                    ax.set_ylim((720,0))
                    ax.set_xlim((0,1080))
                    #ax.invert_yaxis()
                    ax.set_xticks([])
                    ax.set_yticks([])
                    ax.set_frame_on(False)
                except:
                    pass
                
            output = StringIO.StringIO()
            plt.savefig(output)
            image = base64.b64encode(output.getvalue())

            user = users.get_current_user()

            # User should exist, so this should fail otherwise.
            logout_url = users.create_logout_url('/')
            login_url = None
            email_hash = hashlib.md5(user.email()).hexdigest()

            template = env.get_template("results.html")
            html = template.render(count=count,
                                   logout_url=logout_url,
                                   email_hash=email_hash,
                                   image=image,
                                   image_url=image_url)

            self.response.write(html)
            

        else:

            with open("alaska.b64", "r") as f:
                image = f.read()
                
            user = users.get_current_user()

            # User should exist, so this should fail otherwise.
            logout_url = users.create_logout_url('/')
            login_url = None
            email_hash = hashlib.md5(user.email()).hexdigest()
            
            template = env.get_template("results.html")
            html = template.render(count=count,
                                   logout_url=logout_url,
                                   email_hash=email_hash,
                                   image=image,
                                   image_url=image_url)
                
            self.response.write(html)

        # Make composite image


class AboutHandler(webapp2.RequestHandler):

    def get(self):

        user = users.get_current_user()
        
        if user:
            logout_url = users.create_logout_url('/')
            login_url = None
            email_hash = hashlib.md5(user.email()).hexdigest()
        else:
            logout_url = None
            login_url = users.create_login_url('/')
            email_hash = ''

        # Write the page.
        template = env.get_template('about.html')
        html = template.render(logout_url=logout_url,
                               login_url=login_url,
                               email_hash=email_hash)
        self.response.write(html)


class TermsHandler(webapp2.RequestHandler):

    def get(self):

        user = users.get_current_user()
        
        if user:
            logout_url = users.create_logout_url('/')
            login_url = None
            email_hash = hashlib.md5(user.email()).hexdigest()
        else:
            logout_url = None
            login_url = users.create_login_url('/')
            email_hash = ''

        # Write the page.
        template = env.get_template('terms.html')
        html = template.render(logout_url=logout_url,
                               login_url=login_url,
                               email_hash=email_hash)

        self.response.write(html)


class PickerHandler(webapp2.RequestHandler):

    def get(self):

        user = users.get_current_user()

        # User should exist, so this should fail otherwise.
        logout_url = users.create_logout_url('/')
        login_url = None
        email_hash = hashlib.md5(user.email()).hexdigest()

        if self.request.get("image_key"):

            key_id = self.request.get("image_key")
            image_obj= ImageObject.get_by_id(int(key_id))

            try:
                image_url = images.get_serving_url(image_obj.image)
            except:
                print "handle this error"
                
                
        # Write the page.
        template = env.get_template('pickpoint.html')
        html = template.render(logout_url=logout_url,
                               login_url=login_url,
                               email_hash=email_hash,
                               image_url=image_url,
                               image_key = key_id)

        self.response.write(html)



               

class PickHandler(webapp2.RequestHandler):

    def get(self):

        user = users.get_current_user()
        image_key = self.request.get("image_key")
        img_obj = ImageObject.get_by_id(int(image_key))

        if self.request.get("user_picks"):
   
            seismic_obj = SeismicPicks.all().ancestor(img_obj)
            data = seismic_obj.filter("user =", user).get()
            
            if data:
                picks = data.picks
            else:
                picks = json.dumps([])
            self.response.write(picks)
            return
        
        if self.request.get("all"):
            data = SeismicPicks.all().ancestor(img_obj).fetch(1000)

            picks = [i.picks for i in data]
            self.response.write(data)
            return

        if self.request.get("pick_index"):

            data = SeismicPicks.all().ancestor(img_obj)
            data = data.order("-date").fetch(1000)

            index = int(self.request.get("pick_index"))

            self.response.write(data[index].picks)
            return

    def post(self):

        point = (int(self.request.get("x")),
                 int(self.request.get("y")))

        user = users.get_current_user()
        image_key = self.request.get("image_key")

        if not user:
            self.redirect('/')

        image_obj = ImageObject.get_by_id(int(image_key))
        picks = SeismicPicks.all().ancestor(image_obj)
        picks = picks.filter("user =", user).get()

        if not picks:
            picks = SeismicPicks(user=user,
                                 picks=json.dumps([point]).encode(),
                                 parent=image_obj)
            picks.put()
        else:

            all_picks = json.loads(picks.picks)
            all_picks.append(point)
            picks.picks = json.dumps(all_picks).encode()
            picks.put()
            
        self.response.write("Ok")


    def delete(self):

        user = users.get_current_user()
        image_key = self.request.get("image_key")

        img_obj = ImageObject.get_by_id(int(image_key))

        data = SeismicPicks.all().ancestor(img_obj).filter("user =",
                                                           user)
        data = data.get()

        points = json.loads(data.picks)

        if self.request.get("clear"):
            data.delete()
            value = []
            
        elif self.request.get("undo"):
            
            value = points.pop()
            data.picks = json.dumps(points).encode()
            data.put()
                 
        self.response.write(json.dumps(value))


class AddImageHandler(blobstore_handlers.BlobstoreUploadHandler,
                      webapp2.RequestHandler):

    def get(self):

        upload_url = blobstore.create_upload_url('/upload')

        template = env.get_template("upload_image.html")

        html = template.render(upload_url=upload_url)
        self.response.write(html)

    def post(self):

        user = users.get_current_user()


        upload_files = self.get_uploads()
        blob_info = upload_files[0]

        # Read the image file
        reader = blobstore.BlobReader(blob_info.key())

        im = Image.open(reader, 'r')

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

        new_db = ImageObject(description=description,
                             image=output_blob_key)

        new_db.put()

        self.redirect('/pickr?image_key=' +
                      str(new_db.key().id())) 
        
  

# This is the app.  
app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/upload', AddImageHandler),
    ('/new_image', AddImageHandler),
    ('/about', AboutHandler),
    ('/update_pick', PickHandler),
    ('/pickr', PickerHandler),
    ('/terms', TermsHandler),
    ('/results', ResultsHandler),
    ('/comment', CommentHandler),
    ('/vote', VoteHandler)],
    debug=True)
