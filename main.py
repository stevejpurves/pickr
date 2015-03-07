import webapp2
from page_handlers import *
from api_handlers import *


# This is the app.
app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/upload', LibraryHandler),
    ('/library', LibraryHandler),
    ('/add_image', AddImageHandler),
    ('/about', AboutHandler),
    ('/update_pick', PickHandler),
    ('/terms', TermsHandler),
    ('/results', ResultsHandler),
    ('/comment', CommentHandler),
    ('/vote', VoteHandler),
    ('/image', ImageHandler),
    ('BlobURL', BlobURLHandler),
    ('/err', ErrorHandler),
    ('/pickr', PickerHandler),
    ('/profile', ProfileHandler),
    ('/league', LeagueHandler),
    ('/logout', LogoutHandler),
    ('/heatmap', HeatmapHandler),
    (r'/([0-9]+)$', PickerHandler),  # An image ID.
    (r'/([-_a-zA-Z0-9]+)$', PickerHandler),  # A short URL.
    ('/.*', ErrorHandler)],
    debug=True)
