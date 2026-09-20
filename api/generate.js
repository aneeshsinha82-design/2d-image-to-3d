export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {image_url}=req.body||{};
    if(!image_url) return res.status(400).json({error:'image_url is required'});
    const r=await fetch('https://api.meshy.ai/openapi/v1/image-to-3d',{method:'POST',headers:{Authorization:`Bearer ${process.env.MESHY_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({image_url,ai_model:'meshy-7.1',geometry_resolution:'2k',should_texture:true,enable_pbr:true,pose_mode:'a-pose',target_formats:['glb','fbx','obj']})});
    const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={error:text}};
    return res.status(r.status).json(data);
  }catch(e){return res.status(500).json({error:e.message||'Server error'})}
}