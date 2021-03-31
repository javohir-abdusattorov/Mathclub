
Array.prototype.last = function() { return this[this.length - 1] }

let _user
const mainUrl = `${location.origin}:4000`
const route = location.pathname.split("/")[1]
const subRoute = location.pathname.split("/")[2]

const accessToken = localStorage.getItem("access-token") && `Bearer ${localStorage.getItem("access-token")}`
const isAdminRoute = route == "mathclub-admin"
const isCabinetRoute = route == "cabinet"

// Helper functions
const redirect = (url) => window.location = url

const getVal = (queryStr) => $(queryStr).val() ? $(queryStr).val().trim() : null

const dayNumberBetweenDays = (d1, d2) => (new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24)

const areSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

const beautifyPhoneNumber = (num) => {
  const code = num.split(' ')[0]
  const nums = num.split(' ')[1].split('-')
  return `+(998)${code} ${nums[0]}-${nums[1]}-${nums[1]}`
}

const createSrc = (moduleID, topicID, lessonID) => `${mainUrl}/api/v1/modules/lesson-video/${moduleID}/${topicID}/${lessonID}/${accessToken ? accessToken.split(" ").last() : "video"}?t=${new Date().getTime()}`

const createTopicSrc = (moduleID, topicID) => `${mainUrl}/api/v1/modules/topic-file/${moduleID}/${topicID}/${accessToken ? accessToken.split(" ").last() : "file"}?t=${new Date().getTime()}`

const openInNewTab = (url) => {
  $("#_redirecturl").attr("href", url)
  $("#_redirecturl").trigger("click")
}

const logout = () => {
  localStorage.removeItem("access-token")
  redirect("/auth/login")
}

const updateVideoElements = () => {
  player.ready((evt) => {
    $("video source").removeAttr("src")
    $("video").removeAttr("src")
  })
}

const getLang = (l) => l == "uz" ? "O'zbek" : l == "ru" ? "Rus" : "Ingliz"

const updateElWidth = () => {
  for (const el of $("body *")) {
    const w = $(el).attr("w")
    const h = $(el).attr("h")

    if (w) {
      $(el).css("width", `${w}%`)
      $(el).removeAttr("w")
    }

    if (h) {
      $(el).css("height", `${h}%`)
      $(el).removeAttr("h")
    }
  }
}

const round = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0)
  return Math.round(value * multiplier) / multiplier
}

const getID = () => {
  const currLocation = location.href.split('/')
  return currLocation.last().length ? currLocation.last() : currLocation[currLocation.length - 2]
}

const getWeekday = (dayIndex) => {
  const weekDays = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"]
  return weekDays[dayIndex]
}

const createFormData = (data) => {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      const val = typeof(value) == "object" ? JSON.stringify(value) : value
      formData.append(key, val)
    }
  }
  return formData
}

const convertDate = (d) => {
  const date = new Date(d)
  let month = date.getMonth() + 1
  let day = date.getDate()
  if (month < 10) month = `0${month}`
  if (day < 10) day = `0${day}`

  return `${day}.${month}.${date.getFullYear()}`
}

const auth = (res) => {
  const role = res.data.role
  if (isAdminRoute && role !== "admin") redirect("/")
  if (isCabinetRoute && role !== "user") redirect("/")

  if (isCabinetRoute) $("nav .user-account h6").text(res.data.name)
  _user = res.data
} 

const checkAuth = (token) => {
  if (!token) return redirect("/auth/login")

  $.ajax({
    type: 'GET',
    url: `${mainUrl}/api/v1/auth/me`,
    headers: { "Authorization": token },

    success(res) {
      auth(res)
    },

    error(err) {
      alert(JSON.stringify(error.responseJSON.error))
      redirect("/auth/login")
    }
  })
}

const checkAuthAsync = async (token) => {
  if (!token) return redirect("/auth/login")

  try {
    const res = await $.ajax({
      type: 'GET',
      url: `${mainUrl}/api/v1/auth/me`,
      headers: { "Authorization": token },
    })

    auth(res)
  } catch (error) {
    alert(JSON.stringify(error.responseJSON.error))
    redirect("/auth/login")
  }
}

const getMe = async (token) => {
  try {
    const res = await $.ajax({
      type: 'GET',
      url: `${mainUrl}/api/v1/auth/me`,
      headers: { "Authorization": token },
    })

    return res.data
  } catch (error) { return null }
}

const getUser = async (filter) => {
  let queryStr = ''
  for (const [key, value] of Object.entries(filter)) queryStr += !queryStr.length ? `${key}=${value}` : `&${key}=${value}`

  try {
    result = await $.ajax({
      type: 'GET',
      url: `${mainUrl}/api/v1/users/all/?${queryStr}`,
    })

    return result.data
  } catch (error) {
    console.error(error)
  }
}

const getModule = async (filter) => {
  let queryStr = ''
  for (const [key, value] of Object.entries(filter)) queryStr += !queryStr.length ? `${key}=${value}` : `&${key}=${value}`

  try {
    result = await $.ajax({
      type: 'GET',
      url: `${mainUrl}/api/v1/modules/all/?${queryStr}`,
    })

    return result.data
  } catch (error) {
    console.error(error)
  }
}

const getModuleById = async (id) => {
  try {
    result = await $.ajax({
      type: 'GET',
      url: `${mainUrl}/api/v1/modules/module/${id}`,
    })

    return result.data
  } catch (error) {
    console.error(error)
  }
}

// Authorization
if (isAdminRoute) {
  $("title").text(`Mathclub | Modullar`)
  $("body").prepend(`<div id="cabinet-navbar-placeholder"></div>`)
  if (!accessToken) redirect('/auth/login')
  else checkAuth(accessToken)
} else if (isCabinetRoute) {
  $("title").text(`Mathclub | Shaxsiy kabinet`)
  if (!accessToken) redirect('/auth/login')
}

// Settings
const navbarPath = isAdminRoute ? `/assets/utils/components/admin-navbar.html` : `/assets/utils/components/user-navbar.html`
$("input[type='file']").on("change", (evt) => $(evt.target).parent().find("label").text($(evt.target).val().split('\\').last()))
$("video").on('contextmenu', (e) => e.preventDefault())

$(() => {
  updateElWidth()

  $('[data-toggle="tooltip"]').tooltip()
  $(".date-now-year").text(new Date().getFullYear())
  $("#footer-placeholder").load("/assets/utils/components/footer.html")
  $("#navbar-placeholder").load("/assets/utils/components/navbar.html", () => {
    $("body").prepend($("#navbar-placeholder > nav"))
    $("#navbar-placeholder").remove()
  })
  if (typeof($(".phone-number-input").mask) == "function") $(".phone-number-input").mask('00 000-00-00')

  $("#cabinet-navbar-placeholder").load(navbarPath, () => {
    $(`nav a.${subRoute}-link-item`).addClass("active")
    $("body").prepend($("#cabinet-navbar-placeholder > nav"))
    $("#cabinet-navbar-placeholder").remove()
  })
})
