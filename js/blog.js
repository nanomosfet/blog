// Nav JS
var drawer = document.getElementById("drawer");
var menu = document.getElementById("menu");
var toggle_nav = 0;

menu.addEventListener('click', function(e) {
		drawer.classList.toggle('open');
		e.stopPropagation();
		toggle_nav = !toggle_nav;
		console.log(toggle_nav);
});

document.getElementById("main-content").addEventListener('click', function(e) {
	if(toggle_nav) { 
		drawer.classList.toggle('open');
		e.stopPropagation();
		toggle_nav = !toggle_nav;
		console.log(toggle_nav);
	}
});

// Fade JS
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


// Handles DOM element manipulation and AJAX request for likes
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
			document.getElementById("num_likes-"+String(loop)).innerHTML = "&#128077; " + json_obj.num_likes + " | ";
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

// Handles DOM element manipulation and AJAX request for new comments
function commentRequest(blog_id) {
	var http_request = new XMLHttpRequest();
	var new_comment =  document.getElementById("new-comment").value;
	var form = new FormData();
	form.append('blog_id', blog_id);
	form.append('comment_text', new_comment);
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
				var p = document.createElement("p");
				var b = document.createElement("button");
				var t = document.createTextNode("Delete Comment");
				var e = document.createElement("button")
				var t_e = document.createTextNode("Edit")
				p.className = "blog-body"
				e.className = "button";
				b.className = "button";
				e.id = "edit-comment-" + json_obj.comment_id;
				e.appendChild(t_e);
				console.log("In commentRequest: " + json_obj.comment_id);
				e.onclick = function() { toggle_edit_comment(json_obj.comment_id, new_comment) };
				b.onclick = function() { delete_comment(json_obj.comment_id, blog_id) };
				b.appendChild(t)
				d.id = "comment-" + json_obj.comment_id;
				d.appendChild(document.createTextNode(""));
				p.appendChild(c);
				d.appendChild(p);
				d.appendChild(b)
				d.appendChild(e);
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
	http_request.open("POST", "/addcomment", true);
	console.log(form);
	http_request.send(form);
}
var edit_comment_mode = false;

// Handles DOM element manipulation and AJAX request for deleting comments
function delete_comment(comment_id, blog_id) {
	var http_request = new XMLHttpRequest();
	var form = new FormData();
	form.append("comment_id",comment_id);
	form.append("blog_id", blog_id);

	var comment_element = document.getElementById("comment-" + comment_id)	
	// Ignore any clicks until we are done editing comments
	if (edit_comment_mode == true) {
		return 0;
	}
	http_request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			comment_element.remove();
		}
	}
	http_request.open("POST", "/deletecomment", true);
	//http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http_request.send(form);
}
// Handles DOM element manipulation and AJAX request for editing comments
function toggle_edit_comment(comment_id, comment_content) {
	var comment_area = document.getElementById("new-comment");
	var submit_button = document.getElementById("submit-comment");
	var cancel_button = document.createElement("button");
	var edit_button = document.getElementById("edit-comment-" + comment_id);
	var add_comments_section = document.getElementById("add-comments");
	var comments_section = document.getElementById("comments");
	var old_submit_onclick = submit_button.onclick;
	if (edit_comment_mode == true) {
		return 0;
	}

	edit_button.insertAdjacentElement('afterend', add_comments_section);
	cancel_text = document.createTextNode("Cancel")
	cancel_button.classList += "button";
	cancel_button.appendChild(cancel_text);
	submit_button.insertAdjacentElement("afterend", cancel_button);
	console.log("In toggle_edit_comment: " + comment_id);
	comment_area.value = comment_content;
	submit_button.onclick = function() {
		comment_content = comment_area.value;

		update_comment(comment_id, comment_content);
		cancel_button.parentNode.removeChild(cancel_button);
		submit_button.onclick = old_submit_onclick;
		edit_button.onclick = function() {
			toggle_edit_comment(comment_id,comment_content);

		}
		comments_section.appendChild(add_comments_section);
		edit_comment_mode = false;

	};

	cancel_button.onclick = function() {
		comment_area.value = "";
		submit_button.onclick = old_submit_onclick;
		cancel_button.parentNode.removeChild(cancel_button);
		comments_section.appendChild(add_comments_section);
		edit_comment_mode = false;

	};
	edit_comment_mode = true;



}

// Handles DOM element manipulation and AJAX request for updating comments
function update_comment(comment_id, comment_content) {
	var comment_area = document.getElementById("new-comment");
	var http_request = new XMLHttpRequest();
	var error_element = document.getElementById("error");
	var edit_button = document.getElementById("edit-comment-" + comment_id);
	form = new FormData();
	form.append("update_comment", true);
	form.append("comment_id", comment_id);
	form.append("comment_text", comment_content);
	http_request.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			json_obj = JSON.parse(this.responseText);
			if(json_obj.ret_val == true) {
				comment_area.value = "";
				comment = document.getElementById("comment-" + json_obj.comment_id).firstChild.nextSibling;
				comment.innerHTML = json_obj.user + ": " + json_obj.comment_content;
			}
			error_element.innerHTML = json_obj.error;
			setTimeout(function(){
				fade(error_element);
			},2000);
		}

	};
	http_request.open("POST", "/updatecomment", true);
	http_request.send(form)

}
// Handles upload of image with Progress Bar, Adding image to DOM tree
function upload_image(blog_id) {
	var http_request = new XMLHttpRequest();
	var img_upload_element = document.getElementById("img");
	var formData = new FormData();
	var img_element = document.getElementById("blog-img");
	var blog_body = document.getElementById("blog-body");
	var blog_content = document.getElementById("blog-content")
	var delete_image_button = document.createElement("button");
	var t = document.createTextNode("Delete Photo")
	delete_image_button.appendChild(t);
	delete_image_button.id = "delete-img";
	delete_image_button.classList = "button";
	delete_image_button.onclick = function() {
		delete_image(blog_id);
	};
	formData.append("blog_id", blog_id);
	formData.append("img", img_upload_element.files[0]);
	http_request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var rand_num = Math.floor((Math.random()*10000) + 1)
			if (img_element == null) {
				img_element = document.createElement("img");
				img_element.id = "blog-img";
				img_element.src = "/img?img_id="+String(blog_id) +"&n=" + rand_num;
				
				blog_content.insertAdjacentElement("afterend", delete_image_button);
				blog_content.insertAdjacentElement("afterend", img_element);
				
			} else {
				img_element.src = "/img?img_id="+String(blog_id) +"&n=" + rand_num;
			}
		}
	}
	http_request.open("POST", "/images", true);
	console.log(formData);
	img_upload_element.value = "";
	progress_bar = document.createElement("PROGRESS");
	progress_bar.value = 0;
	progress_bar.max = 100;
	display = document.createElement("span");
	img_upload_element.insertAdjacentElement("afterend", progress_bar);
	img_upload_element.insertAdjacentElement("afterend", display);
	if (http_request.upload) {
		http_request.upload.onprogress = function(e) {
			if(e.lengthComputable) {
				progress_bar.max = e.total;
				progress_bar.value = e.loaded;
				display.innerText = Math.floor((e.loaded / e.total) * 100) + "%";
			}
		};
	}
	http_request.onloadstart = function(e) {
    	progress_bar.value = 0;
	};
	http_request.onloadend = function(e) {
	    progress_bar.value = e.loaded;
	    progress_bar.parentNode.removeChild(progress_bar);
	    display.parentNode.removeChild(display);
	};

	http_request.send(formData);
}

function delete_image(blog_id) {
	var i = document.getElementById("blog-img");
	var d = document.getElementById("delete-img");
	var http_request = new XMLHttpRequest();
	var form = new FormData();
	i.parentNode.removeChild(i);
	d.parentNode.removeChild(d);

	form.append("delete_image", true);
	form.append("blog_id", blog_id);

	http_request.open("POST", "/images");
	http_request.send(form);
}

