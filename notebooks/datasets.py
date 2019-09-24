#
# @license BSD-3-Clause
#
# Copyright (c) 2019 Project Jupyter Contributors.
# Distributed under the terms of the 3-Clause BSD License.

import IPython.display
import pandas


def output_url(url):
    IPython.display.publish_display_data(
        {"application/x.jupyter.relative-dataset-urls+json": [url]}
    )
