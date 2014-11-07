
import numpy as np
import StringIO, json, base64

from lib_db import SeismicPicks

from google.appengine.api import images
from google.appengine.ext import blobstore

# For image manipulation
from PIL import Image
from mmorph import dilate, sedisk


def regularize(xarr, yarr):
    """
    For line interpretations.
    Connect the dots of each interpretation.
    
    """
    horx = np.arange(np.amin(xarr), np.amax(xarr)+1)
    hory = np.interp(horx, xarr, yarr)
    return horx, hory

    
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
    data = SeismicPicks.all().ancestor(img_obj).fetch(1000)
    
    # Append all horizons into one big file
    all_picks_x = np.array([])
    all_picks_y = np.array([])   
    
    # Get the dimensions.
    reader = blobstore.BlobReader(img_obj.image)
    im = Image.open(reader, 'r')
    px, py = im.size

    # DEBUGGING SIZE ISSUE
    # Beware, PIL size gives width x height
    print "im.size:", im.size

    # Get all the interpretations.
    for user in data:
        picks = np.array(json.loads(user.picks))
        hx, hy = regularize(picks[:,0], picks[:,1])
        all_picks_x = np.concatenate((all_picks_x, hx))
        all_picks_y = np.concatenate((all_picks_y, hy))
                                 
    # Make a 2d histogram (an image) of the heatmap.
    r = np.array([[0, py], [0, px]])
    heatmap = np.histogram2d(all_picks_y,
                             all_picks_x,
                             bins=(py, px),
                             range=r
                             )[0]

    # Do dilation of the histogram 'image' in heatmap.
    n = 2   # The radius of the disk structuring element
    heatmap_morph = dilate( heatmap.astype(int), B = sedisk(r=n) )

    # DEBUGGING SIZE ISSUE
    print "heatmap.shape:", heatmap_morph.shape

    # Normalize the heatmap from 0-255 for making an image.
    # We subtract 1 first to normalize to the non-zero data only.
    heatmap_norm = normalize(heatmap_morph - 1, 255)
    
    # Make the RGB channels.
    r = np.clip((2 * heatmap_norm), 0, 255)
    g = np.clip(((3 * heatmap_norm) - 255), 0, 255)
    b = np.clip(((3 * heatmap_norm) - 510), 0, 255)

    # Make the A chanel, setting all the non-picked areas to transparent.
    opacity = 0.8
    a = opacity * 255 * np.ones_like(heatmap_norm)
    # Set everything corresponding to zero data to transparent.
    a[heatmap_morph==0] = 0 

    # Make the 4-channel image from an array.
    x = np.dstack([r, g, b, a])
    im_out = Image.fromarray(x.astype('uint8'), 'RGBA')

    # DEBUGGING SIZE ISSUE
    print "x.shape:", x.shape

    # Save out into file-like.
    output = StringIO.StringIO()
    im_out.save(output, 'png')
    
    # We also need to know the number of interpretations.
    count = len(data)

    return base64.b64encode(output.getvalue()), count
