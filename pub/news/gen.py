#!/usr/bin/python

import pandas as pd
from jinja2 import Template

from random import random

import matplotlib.pyplot as plt
import matplotlib.patches as patches

df = pd.read_csv('articles1.csv', index_col='Unnamed: 0')
df = df[df['publication'] != 'Breitbart']
df = df[(1000 <= df['content'].str.len()) & (df['content'].str.len() < 6000)]

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

toc_rect = (toc_rect[0], toc_rect[1], min(toc_rect[2], toc_rect[3]), min(toc_rect[2], toc_rect[3]))

df = df.sample(n=len(sd), replace=False, random_state=2)
df = df.sort_values(by="content", key=lambda x: x.str.len())

articles = list(zip(df.itertuples(), map(to_style, sd)))

template = Template(open('index_template.html').read());
open('index.html', 'w').write(template.render(
    toc_rect=to_style(toc_rect),
    articles=articles
))
