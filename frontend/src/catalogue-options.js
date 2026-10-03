export const categorySlug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const sizeLabel=size=>({XS:'Extra Small',S:'Small',M:'Medium',L:'Large',XL:'Extra Large',XXL:'XXL'}[size]||size);
