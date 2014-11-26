import webapp2
from lib_db import ImageObject, Picks, Vote

from constants import db_parent

import json

from google.appengine.api import users

def authenticate(func):
    """
    Wrapper function for methods that require a logged in
    user
    """
    def authenticate_and_call(self, *args, **kwargs):
        user = users.get_current_user()
        if user is None:
            raise Exception
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
        except Exception as e:
            print e
            self.error(500)
            
    return call_and_catch


class CommentHandler(webapp2.RequestHandler):

    @error_catch
    def get(self):

        index = int(self.request.get("index"))

        data = ImageObject.all().ancestor(db_parent).sort("-date")
        data = data.fetch(1000)[index]

        self.response.write(json.dumps(data.comments))

    @error_catch
    @authenticate
    def post(self, user):

        index = int(self.request.get("index"))
        comment = int(self.request.get("comment"))

        data = ImageObject.all().ancestor(db_parent).sort("date")
        data = data.fetch(1000)[index]
        comments = data.comments
        comments.append(comment)

        data.comments = comments
        data.put()

        self.response.write(comment)


class ImageHandler(webapp2.RequestHandler):

    @error_catch
    @authenticate
    def delete(self,user):

        image_key = self.request.get("image_key")

        image_obj = ImageObject.get_by_id(int(image_key),
                                          parent=db_parent)

        if ((image_obj.user_id == user.user_id()) or
            (users.is_current_user_admin())):

            self.response.headers["Content-Type"] = "application/json"

            if not Picks.all().ancestor(image_obj).get():
                # Then there are no intepretations, so anyone can delete.
                image_obj.delete()
                self.response.write(json.dumps({"success":True}))
            else:
                # There are interpretations.
                if users.is_current_user_admin():
                    # Then you can delete all the same.
                    image_obj.delete()
                    self.response.write(json.dumps({"success":True}))
                else:
                    self.response.write(json.dumps({"interpretations":True}))
            
        else:
            self.error(500)

        
class VoteHandler(webapp2.RequestHandler):

    @error_catch
    def get(self):

        self.response.headers["Content-Type"] = "application/json"
        

        owner_id = self.request.get("user")
        image_key = int(self.request.get("image_key"))

    
        img = ImageObject.get_by_id(image_key, parent=db_parent)
        picks = Picks.all().ancestor(img)

        picks = picks.filter("user_id =", owner_id).get()

        votes = picks.votes

        user = users.get_current_user()

        
        if user:
            user_vote = Vote.all().ancestor(picks).filter("user_id =",
                                                         user.user_id())
            user_vote = user_vote.get()
            if not user_vote:
                user_choice = 0
            else:
                user_choice = user_vote.value


            
        else:
            user_choice = 0

        data = {"votes": votes,
                "user_choice": user_choice}
    
        
        self.response.write(json.dumps(data))
        

    @error_catch
    @authenticate
    def post(self, user):

        self.response.headers["Content-Type"] = "application/json"

        owner_id = self.request.get("user")
        update_vote = int(self.request.get("vote"))
        img_key = int(self.request.get("image_key"))
        user = users.get_current_user()

        img = ImageObject.get_by_id(img_key,
                                    parent=db_parent)
        picks = Picks.all().ancestor(img)
        picks = picks.filter("user_id =", owner_id).get()

        # Prevent self voting
        if user.user_id() == picks.user_id:
            update_vote = 0
            
        elif update_vote > 0:
            update_vote = 1
        else:
            update_vote = -1

        vote = Vote.all().ancestor(picks).filter("user_id =",
                                                 user.user_id()).get()
        if vote is None:
            vote = Vote(user_id=user.user_id(), value=update_vote,
                        parent=picks)
        else:
            # reset if they try to set to the same vote
            if vote.value == update_vote:
                vote.value = 0
            else:
                vote.value = update_vote

        vote.put()
        
        data = {"votes": picks.votes,
                "user_choice": vote.value}
        
        self.response.write(json.dumps(data))
 

class PickHandler(webapp2.RequestHandler):

    @error_catch
    def get(self):

        user = users.get_current_user()
        image_key = self.request.get("image_key")
        img_obj = ImageObject.get_by_id(int(image_key),
                                        parent=db_parent)

        if self.request.get("user_picks"):
   
            data_obj = Picks.all().ancestor(img_obj)
            data = data_obj.filter("user_id =", user.user_id()).get()
            
            if data:
                picks = data.picks
            else:
                picks = json.dumps([])
            self.response.write(picks)
            return
        
        if self.request.get("all"):
            data = Picks.all().ancestor(img_obj).fetch(1000)

            picks = [i.picks for i in data]
            self.response.write(data)
            return

        if self.request.get("user"):

            user_id = self.request.get("user")
            data = Picks.all().ancestor(img_obj)

            # Might as well set owner user 
            # AND current user flags. Display logic
            # is in pick-drawing.js
            owner, current = False, False
            if (user.user_id() == user_id):
                current = True
            if (img_obj.user_id == user_id):
                owner = True
            
            data = data.filter("user_id =", user_id).get()

            output = {"data": json.loads(data.picks),
                      "owner": owner,
                      "current": current}

            self.response.headers["Content-Type"] = "application/json"
            self.response.write(json.dumps(output))
            return

    @error_catch
    @authenticate
    def post(self, user):

        point = (int(self.request.get("x")),
                 int(self.request.get("y")))

        image_key = self.request.get("image_key")

        img_obj = ImageObject.get_by_id(int(image_key),
                                          parent=db_parent)
        
        picks = Picks.all().ancestor(img_obj)
        picks = picks.filter("user_id =", user.user_id()).get()

        if not picks:
            # Then the user has not picked
            # this image before so start
            # some picks for this user.
            picks = Picks(user_id=user.user_id(),
                          picks=json.dumps([point]).encode(),
                          parent=img_obj)
            picks.put()
            
            # In this case we also need to 
            # make a note of this user
            # interpreting this image.

            # Note this is redundant with having img_obj as the
            # parent. Might get out of sync...
            img_obj.interpreters.append(user.user_id())
            img_obj.put()

        else:
            # Then carry on adding picks.
            all_picks = json.loads(picks.picks)
            all_picks.append(point)
            picks.picks = json.dumps(all_picks).encode()
            picks.put()
            
        self.response.write("Ok")

    @error_catch
    @authenticate
    def delete(self, user):

        user = users.get_current_user()
        image_key = self.request.get("image_key")

        img_obj = ImageObject.get_by_id(int(image_key),
                                        parent=db_parent)

        data = Picks.all().ancestor(img_obj).filter("user_id =",
                                                    user.user_id())
        data = data.get()

        points = json.loads(data.picks)

        if self.request.get("clear"):
            data.delete()
            value = []

            # Also remove the user from the list of 
            # interpreters of this image.

            # Note this is redundant and might get out of sync.
            img_obj.interpreters.remove(user.user_id())
            img_obj.put()
            
        elif self.request.get("undo"):
            
            value = points.pop()
            data.picks = json.dumps(points).encode()
            data.put()
                 
        self.response.write(json.dumps(value))
