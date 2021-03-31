
$("form").on('submit', (evt) => {
	evt.preventDefault()

	$(".validation-error").text(``)
	$(".loading-modal").modal('show')

	const data = {
		name: getVal("#name"),
		password: getVal("#password"),
		phoneNumber: getVal("#phone-number"),
	}

	if (!data.name || !data.password) {
		$(".validation-error").text(`Ismingiz va parolni kiriting`)
		$(".loading-modal").modal('hide')
		return;
	}

	if (data.password !== getVal("#confirm-password")) {
		$(".validation-error").text(`Parol bir biriga mos kelmaydi`)
		$(".loading-modal").modal('hide')
		return;
	}

	$.ajax({
	  type: 'POST',
	  url: `${mainUrl}/api/v1/auth/register`,
	  dataType: 'json',
    contentType: 'application/json',
	  data: JSON.stringify(data),

	  success(data) {
	  	const role = data.role
	  	localStorage.setItem("access-token", data.token)
	  	redirect("/cabinet")
	  },

	  error(err) {
	  	console.log(err.responseJSON);
	  	$(".loading-modal").modal('hide')
	  	$(".validation-error").text(err.responseJSON.error)
	  }
	})

})