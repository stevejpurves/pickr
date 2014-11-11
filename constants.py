from lib_db import SeismicParent
from jinja2 import Environment, FileSystemLoader
from os.path import dirname, join
import os

if not os.environ.get('SERVER_SOFTWARE','').startswith('Development'):
    local = False
else:
    local = True

# Jinja2 environment to load templates.
env = Environment(loader=FileSystemLoader(join(dirname(__file__),
                                               'templates')))

# Data store set up.
db_parent = SeismicParent.all().get()
if not db_parent:
    db_parent = SeismicParent()
    db_parent.put()
