/**
 * Created by Administrator on 2016/05/14.
 */
window.onload= function () {
    var cache={};  //缓存博客页面和目录列表JSON
    var Tags={}; //分类列表，属性名为分类名，属性值为此分类的数量

    /*
     * 此函数被绑定到主页面对象上，用于响应“返回主页”按钮的单击事件，以返回目录列表
     * 注意，因为初始时刻，尚未加载这个按钮，它是不存在的，所以将事件绑定到了父元素
     * 利用事件委托来响应按钮的单击事件
     */
    function mainPage (event){
        var btn = document.getElementById("main");
        if(event.target==btn){
            window.location.hash = "";
        }
    }
    /*
     * 响应地址的hash部分变化的函数
     * 此函数被绑定到window对象的hashchange事件上
     */
    function changeUrl(){
		var container = document.getElementById("container");
        var url=window.location.hash.replace("#","");
        if(url===""){
            url="home";  //home page
        }
        if(url==="home"){
            container.innerHTML="";
			loading();
            ajaxReauest("post/index.json",'GET','',rendMain);
        }else if(url.indexOf("tag")!=-1){
            container.innerHTML="";
			loading();
            ajaxReauest("post/index.json",'GET','',function(str){
                initTags(str);
                rendClassifyMain(url.substr(3));
            });
        }else {
            container.innerHTML="";
            loading();
            ajaxReauest(url+".html","GET",'',rendBlog);
            ajaxReauest("post/index.json",'GET','',initTags);  //重新请求目录列表文件以渲染分类列表
        }
    }
    //添加loading效果：
    function loading(){
        var container = document.getElementById("container");
        var divWrap =document.createElement("div");
        var divInner =document.createElement("div");
        var image = document.createElement("img");
        divWrap.className="loading";
        divInner.className="loadingText";
        divInner.innerHTML="loading";
        image.src="assets/loading.gif";
        divWrap.appendChild(divInner);
        divWrap.appendChild(image);
        container.appendChild(divWrap);
    }
    /*
     * 渲染每一篇博客页面的函数
     */
    function rendBlog(blogPage){
        var container = document.getElementById("container");
        ajaxReauest("post/navigation.html",'GET','', function (str) {
            container.innerHTML = str + blogPage;
        });
    }

    //渲染博客目录列表  参数blogList是JSON格式的博客目录
    function rendMain(blogList) {
        var container = document.getElementById("container");
        container.innerHTML="";
        var blogItem = JSON.parse(blogList);
        var table = document.createElement("table");
        table.style.width="100%";
        container.appendChild(table);
        for (var i = 0; i < blogItem.length; i++) {
            var tr = document.createElement("tr");
            var tdTitle = document.createElement("td");
            var tdDate = document.createElement("td");
            var tdTag = document.createElement("td");
            tdTitle.innerHTML="<a href='"+"#post/"+blogItem[i].path + "'>" + blogItem[i].title +"</a>";
            tr.appendChild(tdTitle);
            tdDate.innerHTML= blogItem[i].date;
            tr.appendChild(tdDate);
            for(var j= 0,tagStr='';j<blogItem[i].tags.length;j++){
                tagStr += "，"+blogItem[i].tags[j];
            }
            tagStr=tagStr.substr(1);
            tdTag.innerHTML=tagStr;
            tdTag.style.textAlign="right";
            tr.appendChild(tdTag);
            table.appendChild(tr);
        }
        initTags(cache["post/index.json"]);
    }

    //一个回调函数，根据目录列表blogList的json对象来填充Tags对象
    function initTags(blogList){
        var blogItem = JSON.parse(blogList);
        if(Tags[blogItem[0].tags[0]])return;
        for(var i=0;i<blogItem.length;i++){
            for(j=0 ;j<blogItem[i].tags.length;j++){
                if(!Tags[blogItem[i].tags[j]]){
                    Tags[blogItem[i].tags[j]]=1;
                }else {
                    Tags[blogItem[i].tags[j]]++;
                }
            }
        }
        rendClassify();
    }
    //渲染左侧栏的分类列表
    function  rendClassify(){
        var classifyBox = document.getElementsByClassName("classify")[0];
        classifyBox.innerHTML="";
        var ul=document.createElement("ul");
        ul.style.listStyle="none";
        for(var key in Tags){
            var li = document.createElement("li");
            li.innerHTML = "<a href='"+"#tag"+key + "'>" + key+"("+Tags[key]+")" +"</a>";
            ul.appendChild(li);
        }
        classifyBox.appendChild(ul);
    }

    //单击博客分类项重新渲染目录页面 参数tag是类别
    function rendClassifyMain(tag){
        ajaxReauest("post/navigation.html",'GET','', function (str) {
            var container = document.getElementById("container");
            container.innerHTML=str;
            var blogItem=JSON.parse(cache["post/index.json"]);
            var table = document.createElement("table");
            container.appendChild(table);
            for (var i = 0; i < blogItem.length; i++) {
                var flag = 0;
                for(var index=0 ;index<blogItem[i].tags.length;index++){
                    if(blogItem[i].tags[index]==tag){
                        flag=1;
                    }
                }
                if(flag==0)continue;

                var tr = document.createElement("tr");
                var tdTitle = document.createElement("td");
                var tdDate = document.createElement("td");
                var tdTag = document.createElement("td");
                var tagStr="";
                tdTitle.innerHTML="<a href='"+"#post/"+blogItem[i].path + "'>" + blogItem[i].title +"</a>";
                tr.appendChild(tdTitle);
                tdDate.innerHTML= blogItem[i].date;
                tr.appendChild(tdDate);
                for(var j=0;j<blogItem[i].tags.length;j++){
                    tagStr += "，"+blogItem[i].tags[j];
                }
                tagStr=tagStr.substr(1);
                tdTag.innerHTML=tagStr;
                tdTag.style.textAlign="right";
                tr.appendChild(tdTag);
                table.appendChild(tr);
            }
        });
    }
    /* 利用ajax异步加载外部文件
     *  @url:外部文件的地址
     *  @method：加载的方法，GET或POST
     *  @data：加载时发给服务器的数据
     *  @callback：数据加载异步成功后，调用的回调函数
     */
    function ajaxReauest(url,method,data,callback){
        if(cache[url]){
            callback(cache[url]);
            return;
        }
        var xmlhttp;
        if(window.XMLHttpRequest){
            xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange= function () {
                if(xmlhttp.readyState === 4){
                     if(xmlhttp.status>=200 && xmlhttp.status<300 || xmlhttp.status == 304){
                         cache[url] = xmlhttp.responseText;
                         callback(xmlhttp.responseText);
                     }else {
                         ajaxReauest("post/index.json",'GET','',rendMain);
                         alert("Page loading failed");
                     }
                }
            };
            xmlhttp.open(method,url,true);
            if(method === 'POST'){
                xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
            }
            xmlhttp.send(data);
        }
        else {
            alert("sorry ,your brower is too old to see my blog");
        }
    }

    (function () {
        window.onhashchange=changeUrl;
        var container = document.getElementById("container");
        container.onclick = mainPage;  //因为此时返回按钮还不存在，所以只能将返回主页的按钮的单击事件绑定的父元素上。
        changeUrl();
    })()

};
