# Day 3 greybox map: rooms placed by their map position ("at"), two images of ten rooms each.
# node --input-type=module -e "import { campaign } from './handoff/kit/chill-loop.mjs'; import fs from 'fs'; fs.writeFileSync('/tmp/day3.json', JSON.stringify(campaign.maps[2].rooms.map(r => ({ id: r.id, name: r.name, at: r.at, tiles: r.tiles, stage: r.stages?.[1] ?? null, groups: r.groups || {}, theme: r.theme }))))"
# python3 handoff/maps/mapimg.py /tmp/day3.json handoff/maps
import json, sys
from PIL import Image, ImageDraw, ImageFont

rooms = json.load(open(sys.argv[1]))
out = sys.argv[2]
T = 16                     # px per tile
RW, RH = 32 * T, 18 * T
PAD = 24                   # gap between rooms
FONT = '/System/Library/Fonts/STHeiti Medium.ttc'
f_title = ImageFont.truetype(FONT, 26)
f_room = ImageFont.truetype(FONT, 18)
f_small = ImageFont.truetype(FONT, 13)

C = dict(bg=(42, 45, 54), grid=(52, 55, 64), solid=(112, 116, 127), edge=(75, 79, 89), glass=(224, 72, 77),
         plank=(163, 169, 181), sofa=(176, 106, 179), belt=(77, 81, 92), crate=(217, 137, 59), spill=(232, 169, 58),
         sensor=(79, 209, 197), bottle=(95, 191, 106), cap=(242, 194, 79), guard=(216, 80, 74), sign=(232, 195, 74),
         cart=(95, 168, 211), shutter=(154, 163, 178), drunk=(170, 110, 230), sober=(120, 200, 255), text=(240, 236, 225),
         spawn=(255, 255, 255), seam=(255, 255, 255))

def draw_room(d, ox, oy, r):
    d.rectangle([ox, oy, ox + RW - 1, oy + RH - 1], fill=C['bg'])
    for x in range(33): d.line([ox + x * T, oy, ox + x * T, oy + RH - 1], fill=C['grid'])
    for y in range(19): d.line([ox, oy + y * T, ox + RW - 1, oy + y * T], fill=C['grid'])
    tiles, stage = r['tiles'], r['stage']
    for y in range(18):
        for x in range(32):
            t = tiles[y][x]; s = stage[y][x] if stage else '.'
            px, py = ox + x * T, oy + y * T
            box = [px, py, px + T - 1, py + T - 1]
            if t == '#':
                d.rectangle(box, fill=C['solid'], outline=C['edge'])
            elif t == '^':
                for i in range(2):
                    d.polygon([(px + i * 8, py + T), (px + i * 8 + 4, py + T - 9), (px + i * 8 + 8, py + T)], fill=C['glass'])
            elif t == '=':
                d.rectangle([px, py, px + T - 1, py + 3], fill=C['plank'])
            elif t == 'S':
                d.rectangle([px, py + 2, px + T - 1, py + 8], fill=C['sofa']); d.rectangle([px, py + 10, px + T - 1, py + T - 1], fill=(94, 47, 97))
            elif t in '<>':
                d.rectangle(box, fill=C['belt'])
                a = '>' if t == '>' else '<'
                d.text((px + 3, py - 1), a, font=f_small, fill=(200, 204, 214))
            elif t == 'C':
                d.rectangle([px + 1, py + 1, px + T - 2, py + T - 2], outline=C['crate'], width=2)
            elif t == '~':
                d.rectangle(box, fill=C['solid'], outline=C['edge']); d.rectangle([px, py, px + T - 1, py + 3], fill=C['spill'])
            elif t == 'Z':
                d.rectangle(box, fill=(74, 81, 96)); d.rectangle([px + 5, py + 4, px + 10, py + 9], fill=C['guard'])
                yy = y + 1
                while yy < 18 and tiles[yy][x] not in '#BC<>SGV~Z': yy += 1
                d.rectangle([px + 3, oy + (y + 1) * T, px + T - 4, oy + yy * T - 1], outline=C['shutter'], width=1)
            elif t == 'H':
                d.rectangle(box, fill=(30, 80, 76), outline=C['sensor'])
                g = r['groups'].get(f'{x},{y}')
                if g: d.text((px + 4, py), str(g), font=f_small, fill=C['text'])
            elif t == 'G':
                d.rectangle([px + 1, py, px + T - 2, py + T - 1], fill=C['sensor'])
                g = r['groups'].get(f'{x},{y}')
                if g: d.text((px + 4, py), str(g), font=f_small, fill=(20, 40, 40))
            elif t == 'g':
                d.rectangle([px, py, px + T - 1, py + T - 1], outline=C['sensor'], width=2)
            elif t == 'D':
                d.ellipse([px + 4, py + 2, px + 12, py + T - 1], fill=C['bottle'])
            elif t == '*':
                d.polygon([(px + 2, py + 3), (px + 14, py + 3), (px + 8, py + 10)], fill=C['cap']); d.line([px + 8, py + 10, px + 8, py + 15], fill=C['cap'])
            elif t == 'R':
                h = 2 * T if r['theme'] == 'street' or r['id'] in ('L3-6',) else T
                d.rectangle([px + 2, py + T - h, px + T - 3, py + T - 1], fill=C['guard'])
            elif t == 'L':
                d.rectangle([px - 6, py, px + T + 5, py + 6], fill=C['sign'])
            elif t == 'M':
                d.rectangle([px, py, px + 2 * T - 1, py + 5], fill=C['cart'])
            elif t == 'P':
                d.polygon([(px + 8, py + 2), (px + 14, py + 14), (px + 2, py + 14)], outline=C['spawn'], width=2)
            # the drunk world: what it adds (purple dashes), what it takes away (blue dots)
            if s == '_':
                for k in range(2, T, 5): d.point((px + k, py + T // 2), fill=C['sober']); d.point((px + T // 2, py + k), fill=C['sober'])
                d.rectangle(box, outline=C['sober'])
            elif s not in '.':
                col = C['glass'] if s == '^' else C['spill'] if s == '~' else C['belt'] if s in '<>' else C['drunk']
                for k in range(0, T, 4): d.line([px + k, py, px + k + 2, py], fill=C['drunk']); d.line([px + k, py + T - 1, px + k + 2, py + T - 1], fill=C['drunk'])
                d.line([px, py, px, py + T - 1], fill=C['drunk']); d.line([px + T - 1, py, px + T - 1, py + T - 1], fill=C['drunk'])
                if s == '^':
                    for i in range(2): d.polygon([(px + i * 8, py + T), (px + i * 8 + 4, py + T - 9), (px + i * 8 + 8, py + T)], outline=C['glass'])
                elif s in '<>':
                    d.text((px + 3, py - 1), s, font=f_small, fill=C['drunk'])
                else:
                    d.rectangle([px + 3, py + 3, px + T - 4, py + T - 4], fill=col)
    d.rectangle([ox, oy, ox + RW - 1, oy + RH - 1], outline=(200, 200, 210), width=2)
    label = f"{r['id'].replace('L', '')}  {r['name']}"
    tw = d.textlength(label, font=f_room)
    d.rectangle([ox + 4, oy + 4, ox + 12 + tw, oy + 28], fill=(20, 22, 28))
    d.text((ox + 8, oy + 5), label, font=f_room, fill=C['text'])

LEGEND = [('solid', '牆/地'), ('glass', '玻璃（死）'), ('plank', '單向板'), ('sofa', '沙發'), ('belt', '輸送帶'), ('crate', '會塌紙箱'),
          ('spill', '酒灘'), ('shutter', '鐵捲門'), ('sensor', '感應區/門/橋'), ('bottle', '酒瓶'), ('cap', '調酒'), ('guard', '警衛/轉椅'),
          ('sign', '招牌/燈管'), ('cart', '台車'), ('drunk', '醉時才有'), ('sober', '清醒才有'), ('spawn', '出生點')]

def sheet(sel, title, name):
    xs = [r['at'][0] for r in sel]; ys = [r['at'][1] for r in sel]
    x0, y0 = min(xs), min(ys)
    cols, rows = max(xs) - x0 + 1, max(ys) - y0 + 1
    top, bottom = 56, 70
    W = PAD + cols * (RW + PAD); H = top + PAD + rows * (RH + PAD) + bottom
    img = Image.new('RGB', (W, H), (24, 26, 32)); d = ImageDraw.Draw(img)
    d.text((PAD, 14), title, font=f_title, fill=C['text'])
    pos = {}
    for r in sel:
        ox = PAD + (r['at'][0] - x0) * (RW + PAD); oy = top + PAD + (r['at'][1] - y0) * (RH + PAD)
        pos[r['id']] = (ox, oy); draw_room(d, ox, oy, r)
    # arrows along the way through
    for a, b in zip(sel, sel[1:]):
        (ax, ay), (bx, by) = pos[a['id']], pos[b['id']]
        ca = (ax + RW // 2, ay + RH // 2); cb = (bx + RW // 2, by + RH // 2)
        if a['at'][0] != b['at'][0]: s0, s1 = (ax + RW - 6, ca[1]), (bx + 6, cb[1])
        elif b['at'][1] < a['at'][1]: s0, s1 = (ca[0], ay + 6), (cb[0], by + RH - 6)
        else: s0, s1 = (ca[0], ay + RH - 6), (cb[0], by + 6)
        d.line([s0, s1], fill=(255, 220, 120), width=4)
        d.ellipse([s1[0] - 6, s1[1] - 6, s1[0] + 6, s1[1] + 6], fill=(255, 220, 120))
    lx, ly = PAD, H - bottom + 10
    for key, text in LEGEND:
        d.rectangle([lx, ly + 4, lx + 16, ly + 20], fill=C[key]); d.text((lx + 22, ly + 2), text, font=f_small, fill=C['text'])
        lx += 30 + int(d.textlength(text, font=f_small)) + 16
        if lx > W - 200: lx, ly = PAD, ly + 26
    img.save(f'{out}/{name}')
    print(name, img.size)

sheet(rooms[:10], '醉隱 第三天 地圖（3-1 ～ 3-10）　黃線：關卡順序', 'day3-map-1-10.png')
sheet(rooms[10:20], '醉隱 第三天 地圖（3-11 ～ 3-20）　黃線：關卡順序', 'day3-map-11-20.png')
