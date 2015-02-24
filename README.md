pickr
=====

Web-app for collaborative image interpretation.

## Development Environment

Requires Google App Engine and Python

### [pip](https://github.com/pypa/pip) Python Package Manager

    sudo easy_install pip

### Python Image Library

    sudo pip install PIL --allow-external PIL --allow-unverified PIL
    
See <http://stackoverflow.com/a/21243133/483776>
For freetype build errors see <http://stackoverflow.com/questions/20325473/error-installing-python-image-library-using-pip-on-mac-os-x-10-9>
    

## Running a local server

Using dev_appserver.py from the [Google App Engine SDK](https://cloud.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python)

    dev_appserver.py . --clear_datastore true --log_level debug

### For Remote Access

    dev_appserver.py . --clear_datastore true --log_level debug --host 0.0.0.0

## Test

Frontend unit tests use mocha and chai. To get them running:

1. install node. e.g. on OSX type: `brew install node`
1. type `cd pickr`
1. type `npm install`
1. type `mocha`