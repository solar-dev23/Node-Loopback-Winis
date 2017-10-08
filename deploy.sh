#!/bin/sh
git push && helm upgrade winis charts/winis-io --set image.tag=`git rev-parse HEAD`
