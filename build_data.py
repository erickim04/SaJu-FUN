#!/usr/bin/env python3
"""Generate local astronomical solar term / Korean lunar data used by the offline beta.
Solar longitudes from Swiss Ephemeris (Moshier), Korean lunar calendar from korean-lunar-calendar (MIT).
This does NOT mean KASI verified all 1900..2100 records.
"""
import json
from datetime import datetime,timedelta,timezone
from scipy.optimize import brentq
import swisseph as swe
from korean_lunar_calendar import KoreanLunarCalendar
from pathlib import Path
ROOT=Path(__file__).parent
U=timezone.utc
term_names=['소한','대한','입춘','우수','경칩','춘분','청명','곡우','입하','소만','망종','하지','소서','대서','입추','처서','백로','추분','한로','상강','입동','소설','대설','동지']
# degree where 소한 285, 대한 300, 입춘 315, ..., 동지 270
def angle(jd):
 return swe.calc_ut(jd,swe.SUN,swe.FLG_MOSEPH)[0][0]
def jd_to_ms(jd):return round((jd-2440587.5)*86400000)
def at_year_month(y,m):
 # peak near 5th or 20th Gregorian every month
 for is_second in range(2):
  guess=swe.julday(y,m,6 if not is_second else 20,12)
  name=term_names[2*(m-1)+is_second]
  target=(285+15*(2*(m-1)+is_second))%360
  fn=lambda jd: ((angle(jd)-target+180)%360)-180
  lo=guess-9;hi=guess+9
  if fn(lo)*fn(hi)>0:
   raise ValueError((y,m,name,fn(lo),fn(hi)))
  root=brentq(fn,lo,hi,xtol=1e-9)
  yield [name,jd_to_ms(root)]
terms=[]
for y in range(1899,2103):
 for m in range(1,13):
  terms.extend(at_year_month(y,m))
(ROOT/'data').mkdir(exist_ok=True)
(ROOT/'data'/'terms.js').write_text('/* 천문 계산 추정치(한국천문연구원 전수 검증 아님), UTC unix ms. */\nwindow.SAJU_TERMS='+json.dumps(terms,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
# Korean lunisolar month starts, including 1899 through 2050; for 2050 final date 2050-12-31.
c=KoreanLunarCalendar()
months=[['1900-01-01',1899,12,0]]
for year in range(1900,2051):
 for month in range(1,13):
  for leap in [False,True]:
   if not c.setLunarDate(year,month,1,leap): continue
   if bool(c.isIntercalation)!=leap: continue
   date=c.SolarIsoFormat()
   if '1900-01-01'<=date<='2050-12-31':months.append([date,year,month,1 if leap else 0])
months.sort(key=lambda x:x[0])
(ROOT/'data'/'lunar.js').write_text('/* KoreanLunarCalendar 0.3.1 (MIT), 양력 1900-2050 음력 월 시작 매핑. */\nwindow.SAJU_LUNAR_MONTHS='+json.dumps(months,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('terms',len(terms),'lunar months',len(months),'first',months[:3],'last',months[-3:])
