#!/usr/bin/python

from jinja2 import Template

from random import random, randint

import matplotlib.pyplot as plt
import matplotlib.patches as patches

from collections import namedtuple

def subdivision(i, j, w, h, level=0):
    leaf = (w == 1 and h == 1) or (level > 2 and random() < 0.35)

    if leaf:
        r = w / h
        if 1 / 3 < r and r < 3: return [(i + 1, j + 1, w, h)]
        else: return []

    if w < h:
        h_ = h // 2 
        return (
            subdivision(i, j, w, h_, level + 1) +
            subdivision(i, j + h_, w, h - h_, level + 1)
        )
    else:
        w_ = w // 2
        return (
            subdivision(i, j, w_, h, level + 1) +
            subdivision(i + w_, j, w - w_, h, level + 1)
        )

def to_style(s):
    i, j, w, h = s
    return f'grid-column-start: {i}; grid-column-end: {i + w}; grid-row-start: {j}; grid-row-end: {j + h};' 

sd = subdivision(0, 0, 40, 40)
sd.sort(key=lambda s: s[2] * s[3])

toc_rect = sd[-51]
sd = sd[-50:]

article = namedtuple('article', 'title content')

lorem_ipsum = '''
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque commodo in neque eget eleifend. Nam eu nisi et mauris sagittis pulvinar non vitae sapien. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Curabitur justo ante, fermentum et tellus quis, ullamcorper aliquet tortor. In sit amet nunc sit amet neque facilisis tincidunt at vitae justo. Cras sodales nunc sit amet orci cursus, sed sodales sem fringilla. Morbi purus leo, commodo et ligula sed, finibus iaculis orci. Donec nec ultrices nisi. Aliquam ut congue risus. Etiam fringilla ligula fringilla, commodo magna a, dapibus metus. Maecenas laoreet interdum lorem eget gravida. Ut efficitur lacus eget nibh condimentum facilisis. In hac habitasse platea dictumst. Ut non turpis finibus, consequat dui eget, maximus elit. Maecenas eget convallis diam. Praesent tellus velit, sodales eu mi non, lacinia laoreet tortor. 
'''

articles = [article('Title', (1 + randint(1, 5)) * lorem_ipsum) for i in range(100)]

articles = list(zip(articles, map(to_style, sd)))

template = Template(open('index_template.html').read());
open('index.html', 'w').write(template.render(
    articles=articles
))
