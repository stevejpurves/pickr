from google.appengine.ext import db
from google.appengine.ext import blobstore

import json

class SeismicParent(db.Model):
    pass

class SeismicPicks(db.Model):

    user = db.UserProperty()
    comments = db.StringListProperty()
    date = db.DateTimeProperty(auto_now_add=True)
    votes = db.IntegerProperty()
    picks = db.BlobProperty()

    
class ImageObject(db.Model):

    image = blobstore.BlobReferenceProperty()
    description = db.StringProperty()

    user = db.UserProperty()
    name = db.StringProperty()
   




