<template>
  <div class="container">
    <div class="header-title">
      <el-tooltip class="box-item" effect="light" placement="bottom">
        <template #content>
          全屏
        </template>
        <div class="icon-expand" @click="onToggle"><el-icon>
            <FullScreen />
          </el-icon></div>
      </el-tooltip>
      <div class="title-text">Test平台</div>
      <div class="time">{{ currentTime }}</div>
    </div>
    <div class="canvas" ref="canvasRef" id="canvas">
      <div @click="resetCamera"
        style="color: white;position:absolute;top:40px;right:292px;width:18px;height:18px;cursor:pointer">
        <el-tooltip class="box-item" effect="light" placement="bottom" content="还原镜头">
          <el-icon color="white" size="20">
            <Camera />
          </el-icon>
        </el-tooltip>
      </div>
    </div>

    <div class="el-overlay" v-if="showProgress" :class="{ overlay: showProgress }">
    <div class="process">
      <el-progress :stroke-width="30" :text-inside="true" :percentage="percentage" />
    </div>
    <div class="text_info">
      <p style="color: white">{{percentage}}正在加载模型中...</p>
    </div>
  </div>
    <!-- <div class="progress" v-if="showProgress">
    <el-progress  :percentage="percentage" />
  </div> -->
  </div>
</template>

<script setup>
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { ref, onMounted, onUnmounted} from "vue";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DragControls } from "three/addons/controls/DragControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let showProgress=ref(true)
let percentage=ref(0)
// 切换事件
const onToggle = () => {
  const docElm = document.getElementById('canvas')
  if (!document.fullscreenElement) {
    // isFullscreen.value=true
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen();
    } else if (docElm.webkitRequestFullscreen) {
      docElm.webkitRequestFullscreen();
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

};

let currentTime = ref(
  new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  })
);
//更新时间
let timer = ref(null);
const updateTime = () => {
  timer.value = setInterval(() => {
    currentTime.value = new Date().toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour12: false,
    });
  }, 1000);
}

const squireArr = ref({});

const canvasRef = ref(null);
const objects = [];
let control,boundingBox,clock,mixer;

// 场景
const scene = new THREE.Scene();
const axes = new THREE.AxesHelper(100);
scene.add(axes);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearAlpha(0.2);
renderer.setClearColor(0x228b22,0.1);

renderer.setSize(window.innerWidth, window.innerHeight);
// 镜头
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// camera.lookAt(0, 0, 0);
camera.position.set(-26, 310, 198);

clock=new THREE.Clock()
// 镜头控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", () => {
  renderer.render(scene, camera);
});

//环境光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
let ambientLight = new THREE.AmbientLight(); //设置环境光
  scene.add(ambientLight);
  let pointLight = new THREE.PointLight();
  pointLight.position.set(200, 200, 200); //设置点光源位置
  scene.add(pointLight); //将点光源添加至场景

//  //网格地面
// const gridHelper = new THREE.GridHelper(160, 160);
// gridHelper.material.transparent = true;
// gridHelper.material.opacity = 0.5;
// scene.add(gridHelper);
// 地面
//  const groundGeo = new THREE.PlaneGeometry(160, 160)
//   const groundMat = new THREE.MeshBasicMaterial({
//     color: 0xff0000,
//     side: THREE.DoubleSide, // 两面可见
//     wireframe: true,
//   })
//   const groundMesh = new THREE.Mesh(groundGeo, groundMat)
//   groundMesh.rotation.x = THREE.MathUtils.degToRad(-90)
//   scene.add(groundMesh)

//加天空盒
// const skyloader1 = new THREE.CubeTextureLoader();
//   const texture = skyloader1.load([
//     '../../../public/1.jpg',
//     '../../../public/1.jpg',
//     '../../../public/1.jpg',
//     '../../../public/1.jpg',
//     '../../../public/1.jpg',
//     '../../../public/1.jpg',
//   ]);
//   scene.background = texture;
//   scene.environment = texture

const skyloader=new THREE.TextureLoader()
const skyTexture=skyloader.load(
  './1.jpg',
  (texture)=>{
    texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
    scene.background =texture;
  }
)

 //4.创建地面  
 const ground = new THREE.CircleGeometry(1000, 100);  
 const groundTexture = new THREE.TextureLoader().load("./1.jpeg")
 groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;  
 groundTexture.repeat.set(100, 100); 
 const groundMaterial = new THREE.MeshLambertMaterial({    
  side: THREE.DoubleSide,   
   map: groundTexture,  
  });  
  const groundMesh = new THREE.Mesh(ground, groundMaterial);  
  groundMesh.name = "地面";  groundMesh.rotateX(-Math.PI / 2);  
  groundMesh.position.set(0, -0.345, 1);  
  //scene.add(groundMesh);
 


// 描边
let composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
let outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
//模型描边颜色，默认白色         
outlinePass.visibleEdgeColor.set(0xffff00);
//高亮发光描边厚度
outlinePass.edgeThickness = 3;
//高亮描边发光强度
outlinePass.edgeStrength = 8;
//模型闪烁频率控制，默认0不闪烁
outlinePass.pulsePeriod = 1;
composer.addPass(outlinePass);

let cylinderGeometry = null //光圈
//创建光圈
const aperture = () =>{
  //创建圆柱
  let gemetry = new THREE.CylinderGeometry(40,40,38,64);
  //加载纹理
  let texture = new THREE.TextureLoader().load('./1.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;//每个都重复
  texture.repeat.set(1,1);
  texture.needsUpdate = true;

  let material = [
    //圆柱侧面材质,使用纹理贴图
    new THREE.MeshBasicMaterial({
      map:texture,
      side:THREE.DoubleSide,
      transparent:true
    }),
    //圆柱顶材质
    new THREE.MeshBasicMaterial({
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide
    }),
    //圆柱顶材质
    new THREE.MeshBasicMaterial({
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide
    })
  ];
  cylinderGeometry = new THREE.Mesh(gemetry,material);
  cylinderGeometry.position.set(0,5,0);
  scene.add(cylinderGeometry);
}

let buildingSweepingLightShader = {
      uniforms: {
        "boxH": {
          type: "f",
          value: -10.0
        }
      },
      vertexShader: `
      varying vec3 vColor;
      varying float v_pz;
      void main(){
        v_pz = position.y;
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      uniform float boxH;
      varying vec3 vColor;
      varying float v_pz;
      float plot(float pct){
        return smoothstep(pct-8.0,pct,v_pz) - smoothstep(pct,pct+0.02,v_pz);
      }
      void main(){
        float f1 = plot(boxH);
        vec4 b1 = mix(vec4(0.9,0.2,1.0,0.1),vec4(f1,f1,f1,1.0),0.1);
 
        gl_FragColor = mix(vec4(vColor,1.0),b1,f1);
        gl_FragColor = vec4(vec3(gl_FragColor),0.9);
 
      }
    `
    };
 
    const material = new THREE.ShaderMaterial({
      // color: 0x0000ff,
      uniforms: buildingSweepingLightShader.uniforms,
      vertexShader: buildingSweepingLightShader.vertexShader,
      fragmentShader: buildingSweepingLightShader.fragmentShader,
      vertexColors: true
    })
    material.needsUpdate = true

    function updateFun() {
      const delta = clock.getDelta() // 获取自上次调用的时间差
      controls.update(delta) // 相机更新
 
      buildingSweepingLightShader.uniforms.boxH.value += 0.2
      if (buildingSweepingLightShader.uniforms.boxH.value > 10) {
        buildingSweepingLightShader.uniforms.boxH.value = -10
      }
    }
//
const params = {
				threshold: 0,
				strength: 0,
				radius: 0,
				exposure: 1,
        bg:0x00ffff
			};
    // const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass();

// composer = new EffectComposer( renderer );
// composer.addPass( renderScene );
composer.addPass( bloomPass );
composer.addPass( outputPass );

//
// 
const gui = new GUI();

				const bloomFolder = gui.addFolder( 'bloom' );

				bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {

					bloomPass.threshold = Number( value );

				} );

				bloomFolder.add( params, 'strength', 0.0, 1.0 ).onChange( function ( value ) {

					bloomPass.strength = Number( value );

				} );

				gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

					bloomPass.radius = Number( value );

				} );

				const toneMappingFolder = gui.addFolder( 'tone mapping' );

				toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

					renderer.toneMappingExposure = Math.pow( value, 4.0 );

				} );

        //修改正方体颜色
        gui.addColor(params,'bg').name('模型背景色').onChange(function(value){
         console.log(obj_model);
         obj_model.traverse((e)=>{
          if(e.isMesh&&e.name.includes('基本墙')){
            //解决模型材料共享问题
            e.material=e.material.clone()
            e.material.color.set(value)
            //e.material.side=THREE.DoubleSide
            // console.log(e.name,e,9999);
          }
         })
        });

        gui.domElement.style.display = 'none';
// 

const loader = new OBJLoader(); // 创建STL加载器对象

var obj_model
const initModel = () => {
  let buildMaterial = new THREE.MeshBasicMaterial({
    color: "#009EFF",     // 颜色
    transparent: true,    // 是否开启使用透明度
    opacity: 0.6,        // 透明度
    depthWrite: false,    // 关闭深度写入 透视效果
    side: THREE.FrontSide, // 双面显示
  });

  // 建筑线材质
  let lineMaterial = new THREE.LineBasicMaterial({
    color: "#36BCFF",
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  //加载模型
  loader.load("./model/3d_house.obj", (object) => {
    setTimeout(()=>{
      showProgress.value=false
      percentage.value=0
      gui.domElement.style.display = 'block';
    },800)

    obj_model=object
    object.scale.set(15, 15, 15);
    object.position.set(35, 0, 35); // 将模型进行偏移
    object.traverse((e) => {              // 遍历模型中所有mesh
      // e.material = buildMaterial;             // 赋模型材质
     if(e.isMesh&&e.name.includes('基本墙')){
      e.material=e.material.clone()
      e.material.transparent=true
      e.material.opacity=0.3
      //e.material.side=THREE.DoubleSide
      // console.log(e.material,9999);
     }

     
      if (e.geometry) {
        const edges = new THREE.EdgesGeometry(
          e.geometry
        );
        const line = new THREE.LineSegments(
          edges,
          lineMaterial                      // 赋线条材质
        );
       object.add(line);                     // 把每一个mesh生成的线条添加到场景中
      }
    });
    scene.add(object); // 将网格对象添加到场景中

    boundingBox = new THREE.Box3()
    boundingBox.setFromObject(object)
    let maxVal = boundingBox.max, minVal = boundingBox.min
    boundingBox.max.x = maxVal.x - 3.5
    boundingBox.max.y = maxVal.y - 3.5
    boundingBox.max.z = maxVal.z - 3.5
    boundingBox.min.x = minVal.x + 3.5
    boundingBox.min.y = minVal.y + 3.5
    boundingBox.min.z = minVal.z + 3.5
  },
  (xhr)=>{
    const percent = xhr.loaded / xhr.total;
    percentage.value=Number(percent).toFixed(2)*100
    console.log('加载进度' + percent,percentage.value);
  });
};

const createSpriteLabel = (txt, x, y, z) => {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("width", "380px");
  canvas.setAttribute("height", "100px");
  const ctx = canvas.getContext("2d");
  ctx.font = "28px bold";
  const textMetrics = ctx.measureText(txt);

  // ctx.strokeStyle = "#0864ee";
  // ctx.strokeRect(0, 0, 20, 8);
  ctx.fillStyle = "rgba(10,18,51,0.8)";
  ctx.fillRect(1, 1, 380, 100);

  //文字颜色
  ctx.fillStyle = "#00ff00";

  ctx.fillText(txt, (canvas.width - textMetrics.width) / 2, 60);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
  });
  const sp = new THREE.Sprite(spriteMaterial);
  // sp.scale.set(40, 40, 1);
  sp.scale.set(30, 12, 1);
  sp.position.set(x, y, z);
  scene.add(sp);

  return sp;
};
const createCanvas=(name) =>{
    /**
     * 创建一个canvas对象，绘制几何图案或添加文字
     */
    const canvas = document.createElement("canvas");
    console.log(name)
    const arr = name.split(""); //分割为单独字符串
    let num = 0;
    const reg = /[\u4e00-\u9fa5]/;
    for (let i = 0; i < arr.length; i++) {
        if (reg.test(arr[i])) { //判断是不是汉字
            num += 1;
        } else {
            num += 0.5; //英文字母或数字累加0.5
        }
    }
    // 根据字符串符号类型和数量、文字font-size大小来设置canvas画布宽高度
    const h = 80; //根据渲染像素大小设置，过大性能差，过小不清晰
    const w = h + num * 32;
    canvas.width = w;
    canvas.height = h;
    const h1 = h * 0.8;
    const c = canvas.getContext('2d');
    // 定义轮廓颜色，黑色半透明
    c.fillStyle = "rgba(0,0,0,0.5)";
    // 绘制半圆+矩形轮廓
    const R = h1 / 2;
    c.arc(R, R, R, -Math.PI / 2, Math.PI / 2, true); //顺时针半圆
    c.arc(w - R, R, R, Math.PI / 2, -Math.PI / 2, true); //顺时针半圆
    c.fill();
    // 绘制箭头
    c.beginPath();
    const h2 = h - h1;
    c.moveTo(w / 2 - h2 * 0.6, h1);
    c.lineTo(w / 2 + h2 * 0.6, h1);
    c.lineTo(w / 2, h);
    c.fill();
    // 文字
    c.beginPath();
    c.translate(w / 2, h1 / 2);
    c.fillStyle = "#ffffff"; //文本填充颜色
    c.font = "normal 32px 宋体"; //字体样式设置
    c.textBaseline = "middle"; //文本与fillText定义的纵坐标
    c.textAlign = "center"; //文本居中(以fillText定义的横坐标)
    c.fillText(name, 0, 0);
    console.log(canvas)
    return canvas;
}

const createSprite=(obj,name)=> {
    const canvas = createCanvas(name);//创建一个canvas画布
    // canvas画布作为CanvasTexture的参数创建一个纹理对象
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    // 控制精灵大小(sprite宽高比和canvas画布保持一致)
    const s = 0.05;//通过canvas宽高度缩放后，设置sprite.scale，避免图文宽高比变形
    const x = canvas.width*s;
    const y = canvas.height*s;
    sprite.scale.set(x, y, 1);
    sprite.position.y = y / 2+y; //标签底部箭头和空对象标注点重合 
    // obj.add(sprite); //tag会标注在空对象obj对应的位置
    obj.add(sprite)
    return sprite
}

const positionArr = [
  {
    x: -30,
    z: 12,
  },
  {
    x: -60,
    z: 42,
  },
  {
    x: -100,
    z: 2,
  },
  {
    x: -80,
    z: -80,
  },
  {
    x: 100,
    z: -70,
  },
  {
    x: 40,
    z: -56,
  },
  {
    x: -108,
    z: 72,
  },
  {
    x: 130,
    z: -76,
  },
  {
    x: 108,
    z: -102,
  },

  {
    x: -118,
    z: 65,
  },
  {
    x: -110,
    z: 62,
  },
  {
    x: 122,
    z: 32,
  },
];
let deviceNa = ref([
  {
    name: 'abc就'
  },
  {
    name: '许多b'
  },
  {
    name: 'c'
  },
  {
    name: 'd尽可能考虑'
  },
  {
    name: 'e'
  },
  {
    name: 'f'
  },
  {
    name: 'g'
  },
  {
    name: 'h'
  },
])
const initRandomSquire = (num, deviceName) => {
  const squireGeo = new THREE.BoxGeometry(7, 7, 7);
  const squireMat = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
  });
  squireGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(24 * 3), 3))
  const colors = squireGeo.attributes.color
        let r = Math.random() * 0.2,
          g = Math.random() * 0.1,
          b = Math.random() * 0.8
        //设置立方体六个面24个顶点的颜色  
        for (let i = 0; i < 24; i++) {
          colors.setXYZ(i, r, g, 0.6)
        }
        //重置立方体顶部四边形的四个顶点的颜色
        const k = 2
        colors.setXYZ(k * 4 + 0, .0, g, 1.0)
        colors.setXYZ(k * 4 + 1, .0, g, 1.0)
        colors.setXYZ(k * 4 + 2, .0, g, 1.0)
        colors.setXYZ(k * 4 + 3, .0, g, 1.0)

  for (let i = 0; i < num; i++) {
    // const sp = createSpriteLabel(
    //   deviceName[i].name,
    //   positionArr[i].x,
    //   15,
    //   positionArr[i].z
    // );
    //spArr.value[deviceName[i].name] = sp
    const group=new THREE.Group();
    const squireMesh = new THREE.Mesh(squireGeo, material);
    squireMesh.name = deviceName[i].name;
    squireMesh.type = "squire";
    squireMesh.position.set(positionArr[i].x, 3.5, positionArr[i].z);
    squireArr.value[squireMesh.name] = squireMesh.position;
    scene.add(squireMesh);

    createSprite(squireMesh, deviceName[i].name)
    objects.push(squireMesh);
  }
};

let cylinderRadius = 0;
let cylinderOpacity = 1;
//圆柱光圈扩散动画
const cylinderAnimate = () => {
  cylinderRadius += 0.04;
  cylinderOpacity -= 0.03;
  if (cylinderRadius > 15) {
    cylinderRadius = 0;
    cylinderOpacity = 1;
  }
  if (cylinderGeometry) {
    cylinderGeometry.scale.set(1 + cylinderRadius, 1, 1 + cylinderRadius); //圆柱半径增大
    cylinderGeometry.material[0].opacity = cylinderOpacity; //圆柱可见度减小
  }
}

// 渲染函数
const render = () => {
  // updateFun()
  cylinderAnimate()
  // 更新 Tween.js
  TWEEN.update();
  composer.render()
  // renderer.render(scene, camera);
  requestAnimationFrame(render);
};

//还原镜头
const resetCamera = () => {
  // 初始相机位置和旋转角度 -26, 310, 198
  const initialPosition = new THREE.Vector3(-26, 310, 198); // 初始位置
  // 当前相机位置和旋转角度
  const currentPosition = camera.position.clone();

  // 创建 Tween 动画，从当前位置和旋转角度平滑过渡到初始位置和旋转角度
  new TWEEN.Tween(camera.position)
    .to(initialPosition, 1000) // 过渡时间为 1000 毫秒
    .easing(TWEEN.Easing.Quadratic.InOut) // 使用二次平滑过渡函数
    .onUpdate(() => {
      // 更新相机位置
      // camera.position.copy(camera.position);
      camera.lookAt(0, 0, 0)
    })
    .onComplete(() => {
      controls.reset();
    })
    .start();

}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED
//鼠标移动
const onPointerMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, false);
  if ( intersects.length > 0) {
    const clickedObject = intersects[0].object;
    // console.log(clickedObject)
    if(clickedObject.type=="squire"){
    outlinePass.selectedObjects = [clickedObject]
    }
  }
  renderer.render(scene, camera);
};

//点击
const clickEvent = (e) => {
  e.stopPropagation();
  // 计算鼠标或触摸点的位置
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  // 更新射线
  raycaster.setFromCamera(mouse, camera);
  // 计算与所有对象的交点
  const intersects = raycaster.intersectObjects(scene.children, false);
  if (intersects.length > 0) {
    // 处理点击事件
    // intersects[0] 包含了第一个交点
    const clickedObject = intersects[0].object;
    if(clickedObject.type=="squire"){
    outlinePass.selectedObjects = [clickedObject]
    }
    // console.log(clickedObject,outlinePass,outlinePass.selectedObjects)

    //通过点击到该模型用名字匹配
    if (clickedObject.type == "squire" || clickedObject.type == "Sprite") {
      // Tween.js 用于平滑过渡相机位置
      const tween = new TWEEN.Tween(camera.position)
        .to(
          {
            x: clickedObject.position.x,
            y: clickedObject.position.y,
            z: clickedObject.position.z + 22, // 相机离目标物体一定距离
          },
          500
        )
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate((pos) => {
          // camera.position.copy(camera.position);
          // camera.position.z=pos.z
          controls.target.copy(clickedObject.position);
          camera.lookAt(clickedObject.position);
        })
        .onComplete(() => {
          // 动画完成后更新 controls 的 target
        })
        .start();
    }
  }
};

//重置
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};


onMounted(() => {
  initModel();
  aperture()
  updateTime()
  initRandomSquire(deviceNa.value.length, deviceNa.value)
  canvasRef.value.appendChild(renderer.domElement);
  // renderer.setClearColor(new THREE.Color("#424243")); //#F5F5F5

  //物体拖动
  control = new DragControls([...objects], camera, renderer.domElement);
  control.transformGroup=true
  control.addEventListener("drag", (e) => {
    // console.log(222,e)
    let t=e.object.isSprite
   
    if(e.object.isMesh){
     
    //检查范围并进行限制
    if (!boundingBox.containsPoint(e.object.position)) {
      // 如果物体超出范围，将其位置重置为边界上的最近点
      boundingBox.clampPoint(e.object.position, e.object.position);
    }
    let draggedObject =e.object;
    let position = draggedObject.position;
    controls.enabled = false;
    // let name=deviceNameUpdate[draggedObject.name]
    squireArr.value[draggedObject.name] = position
    // spArr.value[draggedObject.name].position.set(position.x, position.y + 15, position.z)
    }
  });
  control.addEventListener("dragend", () => {
    controls.enabled = true;
  });

  document.getElementById("canvas").addEventListener("click", clickEvent, false);
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("pointermove", onPointerMove)

  render();
});

// 删除侦听器
onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
});
</script>

<style lang="scss" scoped>
.container {
  width: 100vw;
  height: 100vh;
 // background: url("@/assets/bg2.jpg") no-repeat;
  overflow: hidden;

  .header-title {
    //margin-top: 10px;
    position: absolute;
    top: 0;
    width: 100%;
    color: white;
    height: 40px;
    background: url("@/assets/bg-top.jpg") no-repeat;
    background-size: cover;
    z-index: 1000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    box-sizing: border-box;

    .time {
      font-size: 11px;
      margin-top: 20px;
    }

    .title-text {
      font-size: 20px;
      font-weight: bold;
      margin-left: 84px;
    }

    .icon-expand {
      font-size: 16px;
      margin-top: 20px;
      cursor: pointer;
    }
  }

  .canvas {
    width: 100vw;
    height: calc(100vh - 40px);
    margin-top: 40px;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 500ms;
    position: relative;
    overflow: hidden;
    z-index: 99;
    transform-origin: left top;
   // background: url('@/assets/bg.jpg') 100% 100%;
    background-size: contain;
    //transform: scale(0.4775, 0.4775);
  }
  .el-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  overflow: auto;
  .process {
  width: 310px;
  margin-bottom: 10px;
  :deep(.el-progress__text){
    color:white !important;
  }
}

.text_info {
  width: 310px;
  font-size: 15px;
  text-align: center;

  p {
    padding: 0.3rem 0;
  }
}
}

.overlay {
  z-index: 1002;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
}


.box1 {
  position: absolute;
  width: 50px;
  height: 50px;
}
</style>
