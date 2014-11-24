
import numpy as np
import StringIO, json, base64

from lib_db import Picks, ImageObject, User, Vote

from google.appengine.api import images
from google.appengine.ext import blobstore

# For image manipulation
from PIL import Image
from mmorph import dilate, sedisk



def regularize(xarr, yarr, px, py):
    """
    For line interpretations.
    Connect the dots of each interpretation.
    
    """
    horx = np.arange(np.amin(xarr), np.amax(xarr)+1)
    hory = np.interp(horx, xarr, yarr)
    return horx.astype(int), hory.astype(int)

    
def normalize(arr, newmax):
    """
    Normalize the values of an array to some new max.
    
    """
    return (float(newmax) * arr) / np.amax(arr)


def get_result_image(img_obj):
    """
    Takes an image, gets its interpretations, and makes a
    new image that shows all the interpretations concatenated.
    Maps a 'heatmap' colourbar to the result.

    Returns the new 'heatmap' image,
    plus a count of interpretations.
    
    """
    # Read the interpretations for this image.
    data = Picks.all().ancestor(img_obj).fetch(1000)
    
    # Get the dimensions.
    #px, py = img_obj.size # This gets the image from the blobstore
    px, py = img_obj.width, img_obj.height # This doesn't 

    # Make an 'empty' image for all the results. 
    heatmap_image = np.zeros((py,px))

    # Now loop over the interpretations and sum into that empty image.
    for user in data:

        # Make a new image for this interpretation.
        user_image = np.zeros((py,px))

        # Get the points.
        picks = np.array(json.loads(user.picks))

        # Make a line of points (called h for horizon).
        hx, hy = regularize(picks[:,0], picks[:,1], px, py)

        # Make line into image.        
        user_image[(hy,hx)] = 1.

        # Dilate this image.
        n = np.ceil(py / 400.).astype(int) # The radius of the disk structuring element
        dilated_image = dilate(user_image.astype(int),
                               B=sedisk(r=n))

        # Add it to the running summed image.
        heatmap_image += dilated_image

    # Normalize the heatmap from 0-255 for making an image.
    # More muted version: Subtract 1 first to normalize to
    # the non-zero data only.
    heatmap_norm = normalize(heatmap_image, 255)
    
    # Make the RGB channels.
    r = np.clip((2 * heatmap_norm), 0, 255)
    g = np.clip(((3 * heatmap_norm) - 255), 0, 255)
    b = np.clip(((3 * heatmap_norm) - 510), 0, 255)

    # Make the A (opacity) channel, setting all the non-picked areas
    # to transparent.
    opacity = 1.0
    a = opacity * 255 * np.ones_like(heatmap_norm)
    # Set everything corresponding to zero data to transparent.
    a[heatmap_image==0] = 0 

    # Make the 4-channel image from an array.
    x = np.dstack([r, g, b, a])
    im_out = Image.fromarray(x.astype('uint8'), 'RGBA')

    # Save out into file-like.
    output = StringIO.StringIO()
    im_out.save(output, 'png')
    
    # We also need to know the number of interpretations.
    count = len(data)

    return base64.b64encode(output.getvalue()), count

def statistics():

    stats = {"user_count": User.all().count(),
             "image_count": ImageObject.all().count(),
             "pick_count":  Picks.all().count(),
             "vote_count": Vote.all().count()}

    return stats
    

def get_cred(user):

    # Probably need to replace this with a user object some day
    # Then have methods on the object for changing or getting
    # reputation, pushing notifications, and so on. See #105.

    # Also should change to 'rep', rather than 'cred'.

    all_picks = Picks.all().filter("user =", user).fetch(1000)
    all_imgs  = ImageObject.all().filter("user =", user).fetch(1000)

    cred_points = 1 # everyone start with 1

    # Award rep for votes received.
    for picks in all_picks:
        cred_points += picks.votes

    # Award rep for interpretations made.
    cred_points += 3 * len(all_picks)

    # Award rep for uploading.
    cred_points += 3 * len(all_imgs)

    return cred_points 

