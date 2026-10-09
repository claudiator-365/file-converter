from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import subprocess
from pypdf import PdfReader, PdfWriter
W,H=A4
# A) flat RFQ-style, 2 pages, wrapped description, right-aligned numbers, repeated header, TOTAL row
c=canvas.Canvas('samples/text_rfq.pdf',pagesize=A4)
def hdr(y):
    c.setFont('Helvetica-Bold',9)
    for x,t in [(40,'No.'),(75,'Description'),(330,'Qty'),(365,'Unit'),(420,'Unit Price'),(500,'Total')]: c.drawString(x,y,t)
c.setFont('Helvetica-Bold',13);c.drawString(40,H-50,'REQUEST FOR QUOTATION')
c.setFont('Helvetica',9)
c.drawString(40,H-75,'PR No.:');c.drawString(110,H-75,'26-2091')
c.drawString(40,H-90,'Procuring Entity:');c.drawString(130,H-90,'City Government of Cagayan de Oro')
items=[('Bond paper A4, 70gsm, 500 sheets/ream',50,'ream','245.50'),
('Heavy duty stapler with 1,000 pcs staple wire included, black',10,'pc','1,250.00'),
('Ballpen black 0.5mm',200,'pc','12.75'),('Folder long, brown',300,'pc','8.00'),
('Toner cartridge 85A',6,'pc','4,980.25'),('Correction tape',48,'pc','35.00'),
('Marker permanent black',60,'pc','28.50'),('Packing tape 2in',24,'roll','55.00')]
y=H-130;hdr(y);y-=18;c.setFont('Helvetica',9);tot=0;n=0
def row(y,i,d,q,u,p):
    global tot
    c.drawString(40,y,str(i));
    words=d.split(' ');line='';lines=[]
    for w in words:
        if c.stringWidth(line+' '+w,'Helvetica',9)>235 and line: lines.append(line);line=w
        else: line=(line+' '+w).strip()
    lines.append(line)
    for k,l in enumerate(lines): c.drawString(75,y-k*11,l)
    c.drawRightString(350,y,str(q));c.drawString(365,y,u);pv=float(p.replace(',',''));c.drawRightString(470,y,p)
    t=pv*q;tot+=t;c.drawRightString(550,y,f'{t:,.2f}')
    return y-max(18,len(lines)*11+6)
for i,(d,q,u,p) in enumerate(items[:5],1): y=row(y,i,d,q,u,p)
c.showPage();c.setFont('Helvetica',9);y=H-60;hdr(y);y-=18;c.setFont('Helvetica',9)
for i,(d,q,u,p) in enumerate(items[5:],6): y=row(y,i,d,q,u,p)
c.setFont('Helvetica-Bold',9);c.drawString(330,y-6,'TOTAL');c.drawRightString(550,y-6,f'{tot:,.2f}')
c.save();print('expected total',f'{tot:,.2f}')
# B) ruled grid table
st=getSampleStyleSheet();d=SimpleDocTemplate('samples/text_grid.pdf',pagesize=A4)
data=[['Code','Item','Variance','Growth','Amount'],['007','Cement 40kg','(1,200.00)','15%','12,500.50'],['012','Steel bar 10mm','350.5','-2.5%','98,000.00'],['115','Gravel','0','8%','1,234,567.89'],['120','Sand','45','0%','999.00']]
t=Table(data);t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.5,colors.black),('ALIGN',(2,1),(-1,-1),'RIGHT')]))
d.build([Paragraph('Quarterly summary',st['Title']),t]);
# C) prose only
d=SimpleDocTemplate('samples/prose.pdf',pagesize=A4);d.build([Paragraph('Notice. '+'This is a paragraph of ordinary prose with no tabular data at all. '*12,st['Normal'])])
# D) scanned (image only) from text_rfq page 1; E) mixed
subprocess.run(['pdftoppm','-r','110','-png','-f','1','-l','1','samples/text_rfq.pdf','scan'],check=True)
import glob;img=glob.glob('scan*.png')[0]
c=canvas.Canvas('samples/scanned.pdf',pagesize=A4);c.drawImage(img,0,0,W,H);c.save()
w=PdfWriter();w.add_page(PdfReader('samples/text_rfq.pdf').pages[0]);w.add_page(PdfReader('samples/scanned.pdf').pages[0]);w.write(open('samples/mixed.pdf','wb'))
