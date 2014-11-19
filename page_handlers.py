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

from pickthis import get_result_image, get_cred
from constants import local, env, db_parent
from lib_db import ImageObject

# For image serving
import cloudstorage as gcs

def authenticate(func):
    """
    Wrapper function for methods that require a logged in
    user
    """
    def authenticate_and_call(self, *args, **kwargs):
        user = users.get_current_user()
        if user is None:
            self.redirect('/')
            return
        else:
            return func(self, user,*args, **kwargs)
    return authenticate_and_call


def error_catch(func):
    """
    Wrapper for putting all page calls in a try and except
    """
    def call_and_catch(self, *args, **kwargs):

        try:
            func(self, *args, **kwargs)
        except:
            self.redirect("/err")
    return call_and_catch

class ErrorHandler(webapp2.RequestHandler):
    def get(self):
        template = env.get_template("404.html")
        html = template.render()

        self.response.write(html)
        
# Make a basic PageRequest class to handle the params we always need...
class PickThisPageRequest(webapp2.RequestHandler):
    
    def get_base_params(self, **kwargs):

        user = users.get_current_user()
        
        if user:
            logout_url = users.create_logout_url('/')
            login_url = None
            email_hash = hashlib.md5(user.email()).hexdigest()

            cred_points = get_cred(user)
        else:
            logout_url = None
            login_url = users.create_login_url('/')
            email_hash = ''

        params = dict(logout_url=logout_url,
                      login_url=login_url,
                      email_hash=email_hash,
                      cred_points=cred_points)

        params.update(kwargs)
        return params


class MainPage(webapp2.RequestHandler):

    @error_catch
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
            

class ResultsHandler(PickThisPageRequest):

    @error_catch
    def get(self):

        image_key = self.request.get("image_key")
        img_obj = ImageObject.get_by_id(int(image_key),
                                        parent=db_parent)
        image_url = images.get_serving_url(img_obj.image)

        image, count = get_result_image(img_obj)
        image_width = img_obj.width
        image_height = img_obj.height

        params = self.get_base_params(count=count,
                                      image=image,
                                      image_url=image_url,
                                      image_key=image_key,
                                      image_width=image_width,
                                      image_height=image_height)

        template = env.get_template("results.html")
        html = template.render(params)

        self.response.write(html)


class AboutHandler(PickThisPageRequest):
    @error_catch
    def get(self):
        template_params = self.get_base_params()
        template = env.get_template('about.html')
        html = template.render(template_params)
        self.response.write(html)


class TermsHandler(PickThisPageRequest):
    @error_catch
    def get(self):
        template_params = self.get_base_params()
        template = env.get_template('terms.html')
        html = template.render(template_params)
        self.response.write(html)


class PickerHandler(PickThisPageRequest):

    @error_catch
    @authenticate
    def get(self, user, id=None):

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

        params = self.get_base_params(image_url=image_url,
                                      image_key=key_id,
                                      challenge=challenge,
                                      permission=permission,
                                      image_width=image_width,
                                      image_height=image_height)
        
        html = template.render(params)


        self.response.write(html)
     
class LibraryHandler(blobstore_handlers.BlobstoreUploadHandler,
                    PickThisPageRequest):

    @error_catch
    def get(self):

        user = users.get_current_user()

        # Unlogged-in people can see the library.
        if user:
            upload_url = blobstore.create_upload_url('/upload')
            user_id = user.user_id()
        else:
            upload_url = ''
            user_id = ''

        # Get the thumbnail urls
        img_obj = ImageObject.all().ancestor(db_parent).fetch(1000)

        image_dict = [{"key": i.key().id(),
                       "title": i.title,
                       "description": i.description,
                       "challenge": i.challenge,
                       "permission": i.permission,
                       "interpreters": i.interpreters,
                       "image": images.get_serving_url(i.image)}
                       for i in img_obj]

        template = env.get_template('choose.html')

        params = self.get_base_params(images=image_dict,
                                      upload_url=upload_url,
                                      user_id=user_id
                                      )
        html = template.render(params)

        self.response.write(html)

    @error_catch
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

    @error_catch
    @authenticate
    def get(self, user):

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

    @error_catch
    @authenticate
    def post(self, user):

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
        img_obj.user = user

        # Seems like I have to do this to instantiate properly.
        # I thought that's what default=[] is for.
        #img_obj.interpreters = ['default_user']

        img_obj.put()

        self.redirect('/')
        
