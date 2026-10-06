import {Router} from 'express';
import {listCategories} from '../services/categories.service.js';
const router=Router();
const escape=value=>String(value).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
router.get('/sitemap.xml',async(req,res)=>{
 const [products,categories]=await Promise.all([
  req.models.products.find({status:'active'},{projection:{id:1}}).limit(49000).toArray(),listCategories(req.db)
 ]);
 const paths=['/','/about','/contact','/shipping','/rajo-family','/collections/all','/collections/new-arrivals',...categories.map(c=>'/collections/'+encodeURIComponent(c.slug)),...products.map(p=>'/product/'+p.id)];
 res.set('Cache-Control','public, max-age=300, s-maxage=300').type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...new Set(paths)].map(path=>'<url><loc>'+escape('https://rajothreads.com'+path)+'</loc></url>').join('')+'</urlset>');
});
export default router;
