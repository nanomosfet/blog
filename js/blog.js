
function likeRequest(loop, blog_id) {
	var http_request = new XMLHttpRequest();
	var id = "blog_id=" + blog_id;
	var idx = "blog_idx=" + loop;
	var params = id + "&" + idx;
	http_request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {				
			var json_obj = JSON.parse(this.responseText);
			error_element = document.getElementById("error-"+String(loop));			
			error_element.style.display = 'block';
			error_element.style.opacity = 1;
			error_element.innerHTML = json_obj.error
			if (json_obj.net_like == -1) {
				document.getElementById("like-"+String(loop)).innerHTML = "Like";
			} else if (json_obj.net_like == 1) {
				document.getElementById("like-"+String(loop)).innerHTML = "Unlike";
			}
			document.getElementById("num_likes-"+String(loop)).innerHTML = "&#128077; " + json_obj.num_likes;
			setTimeout(function(){
				fade(error_element);
			},1000);
		}

	}

	http_request.open("POST", "/likes", true);
	http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	console.log(params);
	http_request.send(params);
}

function fade(element) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 50);
}
	
function unfade(element) {
    var op = 0.1;  // initial opacity
    element.style.display = 'block';
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 10);
}

function commentRequest(blog_id) {
	var http_request = new XMLHttpRequest();
	var id = "blog_id=" + blog_id;
	var new_comment =  document.getElementById("new-comment").value;
	var comment_text = "comment_text=" + new_comment;
	var params = id + "&" + comment_text;
	var comment_section = document.getElementById("existing-comments");
	var error_element = document.getElementById("error");
	error_element.style.display = 'block';
	error_element.style.opacity = 1;
	http_request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var json_obj = JSON.parse(this.responseText);
			if (json_obj.ret_val == true) {
				var d = document.createElement("div");
				var c = document.createTextNode(json_obj.user + ": " + new_comment);
				var hr = document.createElement("hr");
				var p = document.createElement("pre");
				var b = document.createElement("button");
				var t = document.createTextNode("Delete");
				b.onclick = function() { delete_comment(json_obj.comment_id, blog_id) };
				b.appendChild(t)
				d.id = "comment-" + json_obj.comment_id;				
				p.appendChild(c);
				d.appendChild(p);
				d.appendChild(b)
				d.appendChild(hr);
				

				comment_section.appendChild(d);
				error_element.innerHTML = json_obj.error
			} else { 
				error_element.innerHTML = json_obj.error
			}
			setTimeout(function(){
				fade(error_element);
			},2000);
			document.getElementById("new-comment").value = '';

		}

	}
	http_request.open("POST", "/comments", true);
	http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	console.log(params);
	http_request.send(params);
}

function delete_comment(comment_id, blog_id) {
	var http_request = new XMLHttpRequest();
	var id = "comment_id=" + comment_id;
	var delete_comment = "delete_comment=true"
	var blog_id = "blog_id=" + blog_id;
	var comment_element = document.getElementById("comment-" + comment_id)
	
	var params = id + "&" + delete_comment + "&" + blog_id;
	http_request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			comment_element.remove();
		}

	}
	http_request.open("POST", "/comments", true);
	http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	console.log(params);
	http_request.send(params);
}