import {Router} from 'express';
import {z} from 'zod';
import {listCategories,categorySlug} from '../services/categories.service.js';
import {fail} from '../services/auth.service.js';
const router=Router();
router.get('/admin/categories',async(req,res)=>{
 const categories=await listCategories(req.db);
 const counts=await req.models.products.aggregate([{$match:{status:{$ne:'deleted'}}},{$group:{_id:'$category',products:{$sum:1},stock:{$sum:'$stock'}}}]).toArray();
 res.json({items:categories.map(c=>({...c,products:counts.find(r=>r._id===c.name)?.products||0,stock:counts.find(r=>r._id===c.name)?.stock||0}))});
});
router.post('/admin/categories',async(req,res)=>{
 const {name}=z.object({name:z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9][A-Za-z0-9 &'()-]*$/)}).parse(req.body);
 const slug=categorySlug(name);
 if(['all','all-styles','new-arrivals'].includes(slug)||(await listCategories(req.db)).some(c=>c.slug===slug))throw fail(409,'This category already exists or uses a reserved name.');
 try{await req.db.collection('categories').updateOne({_id:slug},{$set:{name,createdAt:new Date()},$unset:{deletedAt:''}},{upsert:true});}catch(e){if(e.code===11000)throw fail(409,'This category already exists.');throw e;}
 res.status(201).json({name,slug});
});
router.delete('/admin/categories/:slug',async(req,res)=>{
 const category=(await listCategories(req.db)).find(c=>c.slug===req.params.slug);
 if(!category)throw fail(404,'Category not found.');
 const assigned=await req.models.products.countDocuments({category:category.name,status:{$ne:'deleted'}});
 if(assigned)throw fail(409,`Move the ${assigned} product(s) to another category before deleting this category.`);
 await req.db.collection('categories').updateOne({_id:category.slug},{$set:{name:category.name,deletedAt:new Date()}},{upsert:true});
 res.json({ok:true});
});
export default router;
