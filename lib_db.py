from google.appengine.ext import db
from google.appengine.ext import blobstore

import json

class PickrParent(db.Model):
    pass

class SeismicObject(db.Model):

    image = blobstore.BlobReferenceProperty()
    description = blobstore.StringProperty()
    picks = db.BlobProperty()
    name = db.StringProperty()
    votes = db.IntProperty()




