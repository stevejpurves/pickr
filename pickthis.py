
import numpy as np
import StringIO, json, base64

from lib_db import SeismicPicks

from google.appengine.api import images
from google.appengine.ext import blobstore

# For image manipulation
from PIL import Image
from mmorph import dilate

# Connect the dots using one dimensional linear interpretation: np.interp()
def regularize(xarr, yarr):
    # Connect the dots of the horizon spanning the image.
    horx = np.arange(np.amin(xarr),np.amax(xarr)+1)
    hory = np.interp(horx, xarr, yarr)
    return horx, hory
    
def normalize(arr):
    maxval = np.amax(arr)
    normalized = 255.0*(arr)/maxval
    return normalized

def get_result_image(img_obj):

        data = SeismicPicks.all().ancestor(img_obj).fetch(1000)
        
        count = len(data)
        
        # Append all horizons into one big file
        all_picks_x = np.array([])
        all_picks_y = np.array([])   
        
        # Get the dimensions.
        reader = blobstore.BlobReader(img_obj.image)
        im = Image.open(reader, 'r')
        px, py = im.size

        # Get all the interpretations.
        for user in data:
            picks = np.array(json.loads(user.picks))
            hx, hy = regularize(picks[:,0], picks[:,1])
            all_picks_x = np.concatenate((all_picks_x, hx))
            all_picks_y = np.concatenate((all_picks_y, hy))
                                     
        # Make a 2d histogram (an image) of the heatmap.
        m = 1
        r = np.array([[0, py], [0, px]])
        heatmap, yedges, xedges = np.histogram2d(all_picks_y,
                                                 all_picks_x,
                                                 bins=(py/m,px/m),
                                                 range=r) 

        # Do dilation of the histogram 'image' in heatmap.
        n = 3   # The dilation structuring element (n x n).
        heatmap_morph = dilate( heatmap.astype(int), B = np.zeros((n,n)).astype(int) )

        # Normalize the heatmap from 0-255 for making an image.
        heatmap_norm = normalize(heatmap_morph)
        
        # Make the RGB channels.
        r, g, b = heatmap_norm, heatmap_norm, heatmap_norm
        a = 200*np.ones(heatmap_norm.shape)
        a[r == 0] = 0
    
        x = np.dstack([r, g, b, a])

        

        im_out = Image.fromarray(x.astype('uint8'), 'RGBA')
        output = StringIO.StringIO()
        im_out.save(output, 'png')
        
        return base64.b64encode(output.getvalue()), count
