from google.appengine.ext import db
from google.appengine.ext import blobstore
from google.appengine.api import images
from google.appengine.api import users

from PIL import Image

import json


class User(db.Model):

    # Hack to log the number of users who have logged in
    user_id = db.StringProperty()
    nickname = db.StringProperty()
    email = db.EmailProperty()
    linkedin = db.LinkProperty()
    education = db.StringProperty()
    location = db.GeoPtProperty()
    
    @property
    def picks(self):
        all_picks = Picks.all()
        my_picks = all_picks.filter("user_id =", self.user_id)
        return my_picks.fetch(1000)

    @property
    def uploads(self):
        all_imgs = ImageObject.all()
        my_imgs = all_imgs.filter("user_id =", self.user_id)
        my_imgs = my_imgs.filter("title !=", '')
        return my_imgs.fetch(1000)

    @property
    def votes(self):
        votes = 0
        for picks in self.picks:
            votes += picks.votes
        return votes

    @property
    def cred(self):
        rep = 1                       # everyone start with 1
        rep += self.votes             # votes received
        rep += 3 * len(self.picks)    # picks performed
        rep += 3 * len(self.uploads)  # uploads performed

        return rep


class Vote(db.Model):

    # The user_id of the vote caster
    user_id = db.StringProperty()

    # +1 or -1
    value = db.IntegerProperty()
    

class ImageParent(db.Model):
    pass


class Picks(db.Model):

    user_id = db.StringProperty()
    date = db.DateTimeProperty(auto_now_add=True)
    picks = db.BlobProperty()

    @property
    def votes(self):
        """
        Returns the vote count for the picks
        """
        votes = Vote.all().ancestor(self).fetch(10000)

        total = 0
        for vote in votes:
            total += vote.value

        return total


class History(db.Model):
    user_id = db.StringProperty()
    date = db.DateTimeProperty(auto_now_add=True)
    picks = db.BlobProperty()

class Comment(db.Model):

    # Parent should be ImageObject

    text = db.TextProperty(required=True)
    user_id = db.StringProperty()
    datetime = db.DateTimeProperty(auto_now_add=True)

    @property
    def nickname(self):

        user = User.all().filter("user_id =",
                                 self.user_id).get()
        return user.nickname
    
class Heatmap(db.Model):
    stale = db.BooleanProperty(default=False)
    png = db.BlobProperty()

class ImageObject(db.Model):

    image = blobstore.BlobReferenceProperty()

    width = db.IntegerProperty()
    height = db.IntegerProperty()

    title = db.StringProperty(default="")
    shorturl = db.StringProperty()
    description = db.StringProperty(default="")
    challenge = db.StringProperty(default="")
    permission = db.StringProperty(default="")
    pickstyle = db.StringProperty(default="")
    rightsholder = db.StringProperty(default="")

    # Eventually we will want this
    # location = db.GeoPtProperty()

    favouriters = db.ListProperty(str, default=[])

    # This is safer than using a user directly
    # Because email address can change.
    user_id = db.StringProperty()

    @property
    def interpreters(self):
        """
        Returns a list of user_ids that have
        interpreted this image.
        """
        picks = Picks.all().ancestor(self)
        user_ids = [p.user_id for p in picks]

        return user_ids

    @property
    def size(self):
        """
        Returns the size as a tuple
        """
        reader = blobstore.BlobReader(self.image)
        im = Image.open(reader, 'r')
        s = im.size

        return s # width, height

    # I think this has to be a method, not property,
    # if we want to pass in arguments.
    def url(self, size=0, crop=False):
        """
        Returns a serving url for the image
        """
        return images.get_serving_url(self.image,
                                      size=size,
                                      crop=crop)

    @property
    def id(self):

        return self.key().id()
    
    @property
    def nickname(self):

        user = User.all().filter("user_id =",
                                 self.user_id).get()
        return user.nickname
