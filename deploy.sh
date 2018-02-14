#!/bin/sh
git push google master && helm upgrade winis charts/winis-io --set image.tag=`git rev-parse HEAD`
