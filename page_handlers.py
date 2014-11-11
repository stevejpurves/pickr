import webapp2
import hashlib
import StringIO
import time

from google.appengine.api import users
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import blobstore
from google.appengine.api import images


# For image manipulation
from PIL import Image

from pickthis import get_result_image
from constants import local, env, db_parent
from lib_db import ImageObject

# For image serving
import cloudstorage as gcs

# Make a basic PageRequest class to handle the params we always need...
class PickThisPageRequest(webapp2.RequestHandler):
    
    def get_base_params(self, **kwargs):

        user = users.get_current_user()
        
        if user:
            logout_url = users.create_logout_url('/')
            login_url = None
            email_hash = hashlib.md5(user.email()).hexdigest()
        else:
            logout_url = None
            login_url = users.create_login_url('/')
            email_hash = ''

        params = dict(logout_url=logout_url,
                      login_url=login_url,
                      email_hash=email_hash)

        return params


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
            self.redirect('/library')
            

class ResultsHandler(webapp2.RequestHandler):
    def get(self):

        image_key = self.request.get("image_key")
        img_obj = ImageObject.get_by_id(int(image_key),
                                        parent=db_parent)
        image_url = images.get_serving_url(img_obj.image)

        image, count = get_result_image(img_obj)
        image_width = img_obj.width
        image_height = img_obj.height

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
                                image_url=image_url,
                                image_key=image_key,
                                image_width=image_width,
                                image_height=image_height)

        self.response.write(html)


class AboutHandler(PickThisPageRequest):
    def get(self):
        template_params = self.get_base_params()
        template = env.get_template('about.html')
        html = template.render(template_params)
        self.response.write(html)


class TermsHandler(PickThisPageRequest):
    def get(self):
        template_params = self.get_base_params()
        template = env.get_template('terms.html')
        html = template.render(template_params)
        self.response.write(html)


class PickerHandler(webapp2.RequestHandler):

    def get(self, id=None):

        user = users.get_current_user()

        # User should exist, so this should fail otherwise.
        logout_url = users.create_logout_url('/')
        login_url = None
        email_hash = hashlib.md5(user.email()).hexdigest()

        if id:
            key_id = id
        else:
            key_id = self.request.get("image_key")


        img_obj= ImageObject.get_by_id(int(key_id),
                                       parent=db_parent)

        try:
            image_url = images.get_serving_url(img_obj.image)
        except:
            print "handle this error"
                
        challenge = img_obj.challenge
        permission = img_obj.permission
        image_width = img_obj.width
        image_height = img_obj.height

        # Write the page.
        template = env.get_template('pickpoint.html')
        html = template.render(logout_url=logout_url,
                               login_url=login_url,
                               email_hash=email_hash,
                               image_url=image_url,
                               image_key=key_id,
                               challenge=challenge,
                               permission=permission,
                               image_width=image_width,
                               image_height=image_height)

        self.response.write(html)
     
class LibraryHandler(blobstore_handlers.BlobstoreUploadHandler,
                    webapp2.RequestHandler):

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

        upload_url = blobstore.create_upload_url('/upload')

        # Get the thumbnail urls
        img_obj = ImageObject.all().ancestor(db_parent).fetch(1000)

        image_dict = [{"key": i.key().id(),
                       "title": i.title,
                       "description": i.description,
                       "challenge": i.challenge,
                       "permission": i.permission,
                       "image": images.get_serving_url(i.image)}
                       for i in img_obj]

        template = env.get_template('choose.html')
        html = template.render(images=image_dict,
                               upload_url=upload_url,
                               logout_url=logout_url,
                               login_url=login_url,
                               email_hash=email_hash)

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
                             image=output_blob_key,
                             parent=db_parent)

        new_db.put()

        self.redirect('/add_image?image_key=' +
                      str(new_db.key().id())) 
        
        
class AddImageHandler(PickThisPageRequest):

    def get(self):

        image_key = self.request.get("image_key")

        img_obj = ImageObject.get_by_id(int(image_key),
                                        parent=db_parent)

        image_url = images.get_serving_url(img_obj.image)

        
        template_params = self.get_base_params()
        template_params.update(image_url=image_url,
                               image_key=image_key)

        template = env.get_template("add_image.html")
        html = template.render(template_params)
        self.response.write(html)

    def post(self):

        user = users.get_current_user()
        image_key = self.request.get("image_key")

        title = self.request.get("title")
        description = self.request.get("description")
        challenge = self.request.get("challenge")
        pickstyle = self.request.get("pickstyle")
        permission = self.request.get("permission")

        img_obj = ImageObject.get_by_id(int(image_key),
                                        parent=db_parent)

        img_obj.width = img_obj.size[0]
        img_obj.height = img_obj.size[1]

        img_obj.title = title
        img_obj.description = description
        img_obj.challenge = challenge
        img_obj.pickstyle = pickstyle
        img_obj.permission = permission

        img_obj.put()

        self.redirect('/')
        
