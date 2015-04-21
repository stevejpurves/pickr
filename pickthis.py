
import numpy as np
import StringIO, json, base64
import time
import itertools
from lib_db import Picks, ImageObject, User, Vote, Heatmap

from google.appengine.api import images
from google.appengine.ext import blobstore

# For image manipulation
from PIL import Image
from mmorph import dilate, sedisk


def interpolate(x_in, y_in):
    """
    For line interpretations.
    Connect the dots of each interpretation.
    """

    # Check difference in x and in y, so we can
    # interpolate in the direction with the most range

    x_range = np.arange(np.amin(x_in), np.amax(x_in)+1)
    y_range = np.arange(np.amin(y_in), np.amax(y_in)+1)

    if x_range.size >= y_range.size:
        x_out = x_range
        y_out = np.interp(x_out, x_in, y_in)
    else:
        y_out = y_range
        x_out = np.interp(y_out, y_in, x_in)

    return x_out.astype(int), y_out.astype(int)


def normalize(a, newmax):
    """
    Normalize the values of an
    array a to some new max.

    """
    return (float(newmax) * a) / np.amax(a)

def draw_pick_to_user_image(user_image, picks, img_obj):
    w = img_obj.width
    h = img_obj.height
    pickstyle = img_obj.pickstyle    

    if pickstyle == 'polygons':
        picks = np.append(picks, picks[0]).reshape(picks.shape[0]+1, picks.shape[1])

    # Deal with the points, and set the
    # radius of the disk structuring element.
    if pickstyle != 'points':
        for i, pick in enumerate(picks[:-1]):

            xpair = picks[i:i+2, 0]

            if xpair[0] > xpair[1]:
                xpair = xpair[xpair[:].argsort()]
                xrev = True
            else:
                xrev = False

            ypair = picks[i:i+2, 1]

            if ypair[0] > ypair[1]:
                ypair = ypair[ypair[:].argsort()]
                yrev = True
            else:
                yrev = False

            # Do the interpolation
            x, y = interpolate(xpair, ypair)

            if xrev:  # then need to unreverse...
                x = x[::-1]
            if yrev:  # then need to unreverse...
                y = y[::-1]

            # Build up the image, accounting for pixels at
            # the edge, which have the wrong indices.
            x[x >= w] = w - 1
            y[y >= h] = h - 1
            user_image[(y, x)] = 1.

    else:
        x, y = picks[:, 0], picks[:, 1]
        user_image[(y, x)] = 1.

def draw_all_picks_to_user_image(user_image, all_picks, img_obj):
    if all_picks[0].size == 3:
        # picks are tagged with their group
        for group in itertools.groupby(all_picks, lambda x:x[2]):
            picks = np.array([p for p in group[1]])
            draw_pick_to_user_image(user_image, picks, img_obj)
    else:
        draw_pick_to_user_image(user_image, all_picks, img_obj)

def calculate_disk_radius(img_obj):
    w = img_obj.width
    h = img_obj.height
    avg = (w + h) / 2.
    if (img_obj.pickstyle == 'points'):
        n = np.ceil(avg / 150.).astype(int)
    else:
        n = np.ceil(avg / 300.).astype(int)
    return n

def generate_heatmap(img_obj, data, opacity_scalar):
    w = img_obj.width
    h = img_obj.height

    # Make an 'empty' image for all the results.
    heatmap_image = np.zeros((h, w))
    alpha_image = np.ones_like(heatmap_image)

    # get total number of votes on this challenge
    total_votes = 0
    top_vote = 0
    for user in data:
        total_votes += user.votes
        if user.votes > top_vote:
            top_vote = user.votes

    # Now loop over the interpretations and sum into that empty image.
    for user in data:
        # get the number of votes this interpretation has
        nvotes = user.votes

        # Make a new image for this interpretation.
        user_image = np.zeros((h, w))

        # Get the points.
        all_picks = np.array(json.loads(user.picks))
        
        if all_picks.size == 0:
            continue

        draw_all_picks_to_user_image(user_image, all_picks, img_obj)
        n = calculate_disk_radius(img_obj)
        # Dilate this image.
        dilated_image = dilate(user_image.astype(int), B=sedisk(r=n))

        heatmap_image += dilated_image

        # Add it to the running summed image.
        if opacity_scalar == 'votes':
            if nvotes > -5:
                alpha_image += dilated_image * (nvotes + 5) / (top_vote + 5)
        elif opacity_scalar == 'rep':
            # Do something else
            pass
        else:
            pass

    # Normalize the heatmap from 0-255 for making an image.
    # More muted version: Subtract 1 first to normalize to
    # the non-zero data only.
    heatmap_norm = normalize(heatmap_image, 255)
    alpha_norm = normalize(alpha_image, 255)

    # Make the RGB channels.
    r = np.clip((2 * heatmap_norm), 0, 255)
    g = np.clip(((3 * heatmap_norm) - 255), 0, 255)
    b = np.clip(((3 * heatmap_norm) - 510), 0, 255)
    a = alpha_norm

    # Set everything corresponding to zero data to transparent.
    a[heatmap_image == 0] = 0

    # Make the 4-channel image from an array.
    im = np.dstack([r, g, b, a])
    im_out = Image.fromarray(im.astype('uint8'), 'RGBA')

    output = StringIO.StringIO()
    im_out.save(output, 'png')

    cached_heatmap = Heatmap.all().ancestor(img_obj).get()
    if not cached_heatmap:
        cached_heatmap = Heatmap(stale=False,
                                 png=output.getvalue(),
                                 parent=img_obj)
    else:
        cached_heatmap.stale = False
        cached_heatmap.png = output.getvalue()

    cached_heatmap.put()

def statistics():

    stats = {"user_count": User.all().count(),
             "image_count": ImageObject.all().count(),
             "pick_count":  Picks.all().count(),
             "vote_count": Vote.all().count()}

    return stats
