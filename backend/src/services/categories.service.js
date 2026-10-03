import {fail} from './auth.service.js';
export const categorySlug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const defaultCategories=['Sarees','Lehengas','Kurta sets'];
export async function listCategories(db){
 const [stored,legacy]=await Promise.all([db.collection('categories').find({}).sort({name:1}).toArray(),db.collection('products').distinct('category',{status:{$ne:'deleted'}})]);
 return [...new Map([...defaultCategories,...legacy,...stored.map(c=>c.name)].filter(Boolean).map(name=>[categorySlug(name),{name,slug:categorySlug(name)}])).values()];
}
export async function validateCategory(db,name){
 if(!(await listCategories(db)).some(c=>c.name===name))throw fail(400,'Add this category in Categories before selecting it.');
}
