var submitName;
function onChangeFile(){
    document.getElementById('numImg').value='f';
    document.getElementById('uploadImg').click(); 
}
function choose(num){

    document.getElementById('numImg').value=String(num);
    let olds =document.getElementsByClassName('chosen');
    let cons= document.querySelectorAll('[class~='+'a'+num+']');
    if(cons.length>0&&cons[0].classList.contains('chosen'))return;
 
    let sizeO=olds.length;
    for(let ind =0;ind<sizeO;ind++){
       olds[ind].classList.remove('chosen');       
    }
   
    for(let ind =0;ind<cons.length;ind++){
        cons[ind].classList.add('chosen');
    } 
 
}
function choose2(num){

    let olds =document.getElementsByClassName('chosen');
    let cons= document.querySelectorAll('[class~='+'a'+num+']');
    if(cons.length>0&&cons[0].classList.contains('chosen'))return;

    for(let ind =0;ind<olds.length;ind++){
       olds[ind].classList.remove('chosen');       
    }
    
    for(let ind =0;ind<cons.length;ind++){
        cons[ind].classList.add('chosen');
    } 

}
document.getElementById("date").valueAsDate = new Date();

function onClickSubmit(event){
    submitName=event.target.name;
}

function onClickSaveSubmit(event){
    onClickSubmit(event)
    document.getElementById('saved').style=" visibility:visible;";
} 
function onClickEmailSubmit(event){
    onClickSubmit(event)
    document.getElementById('sent').style=" visibility:visible;";
}

function onKeyPressEmail(){
    var re = /\S+@\S+\.\S+/;
    var val=document.getElementById('email').value;

    if(val!==''&&re.test(val))
        document.getElementById('emailSubmit').disabled=false;
    else
        document.getElementById('emailSubmit').disabled=true;
    
}
function onKeyPressSaveName(){
    var val=document.getElementById('saveName').value;
    if(val!=='')
        document.getElementById('saveD').disabled=false;
    else
        document.getElementById('saveD').disabled=true;
    }
/*
function onClickCreate(){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/create', true);
    
    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    
    xhr.onreadystatechange = function() {//Call a function when the state changes.
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            // Request finished. Do processing here.
            document.getElementById('afterSubmit').style ="visibility:visible;";
        }
    }
    xhr.send(HTMLBodyElement); 
/*
   var xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        
       
   };
   xhttp.open("POST", "/create", true);
   xhttp.send();
}*/

function submitForm(oFormElement)
{
  if(submitName=='create'){
    document.getElementById('afterSubmit').style.display="block";
    document.getElementById('pending').style="visibility:visible;";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {//Call a function when the state changes.
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                document.getElementById('pending').style.display="none";
                document.getElementById('afterSubmit').style ="visibility:visible;";
        }
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 424) {
            document.getElementById('pending').style.display="none";
            document.getElementById('pdfError').style.display="block";
            document.getElementById('afterSubmit').style ="visibility:visible;";}
    }
    xhr.onerror = function(){ alert (xhr.responseText); } // failure case
    xhr.open ("POST","/create", true);
    xhr.send (new FormData (oFormElement));
    return false;
    }
}

 var i=0;

 function addLine() {
                    i++;
                    var sp=document.getElementById("sp");
                    sp.insertAdjacentHTML('beforeend', ` <div class="sp-r" id="sp-r-`+i+`">
                    <div class="col-60">
                        <input type="text" id="product`+i+`" name="product`+i+`" placeholder="מוצר">
                    </div>
                    <div class="col-18">
                        <input type="number" id="count`+i+`"  name="count`+i+`" placeholder="כמות">
                    </div>
                    <div class="col-18">
                        <input type="number" id="price`+i+`" name="price`+i+`" placeholder="מחיר">
                    </div>
                </div>`);
  }
  function cleanLines(count){
      let list=document.getElementById("sp");
      for(let t=list.childElementCount-1;t>=count&t>0;t--){
           list.removeChild(document.getElementById("sp-r-"+t));  
           i--;  
      }
    }

