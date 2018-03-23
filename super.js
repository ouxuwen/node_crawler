const superagent = require('superagent');
const cheerio = require('cheerio');
const https = require('https');
const http = require('http');
const reptileUrl = "http://search.m.dangdang.com/search_ajax.php";
const data = require('./data');
const file = require('fs');
const request = require('request');
const mkdirp = require('mkdirp');

//不知道为啥 当当返回的数据是空
//试了猫眼的又可以
function getList(keyword,page) {
    return new Promise((resolve, reject) => {

        var options = {
            url: reptileUrl+`?keyword=${keyword}&sid=5eeea0da06eac7b38395b08b4ee14d14&have_ad=1&act=get_product_flow_search&result_set_all_count=17&has_used_recommend=0&page=${page}`,
            //url:"http://m.maoyan.com/movie/list.json?type=hot&offset=0&limit=1000",
            headers: {
                'Accept': " text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                'Accept-Language': ' zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                // 'Cookie': '__permanent_id=20171031142819310368736992098274442; dest_area=country_id%3D9000%26province_id%3D111%26city_id%20%3D0%26district_id%3D0%26town_id%3D0; _jzqco=%7C%7C%7C%7C%7C1.741543986.1509431316213.1509431352165.1509431356793.1509431352165.1509431356793.0.0.0.4.4; MDD_permanent_id=20180308172237761661818428583225164; MDD_province_str=%E5%B9%BF%E4%B8%9C; MDD_province_id=144; MDD_city_str=%E6%B7%B1%E5%9C%B3%E5%B8%82; MDD_city_id=7; MDD_area_str=%E5%85%B6%E4%BB%96%E5%8C%BA%E5%8E%BF; MDD_area_id=1440299; ddscreen=2; MDD_sid=5eeea0da06eac7b38395b08b4ee14d14; __rpm=%7Cflexible%20155238...1521704717342; MDD_producthistoryids=60597132%257C61872286%257C1057985386%257C1112115256',
                // 'Host': 'search.m.dangdang.com',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': 1,
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
                'proxy': "39.134.68.25"
            }
        };

        request(options, (error, response, body)=> {
            if (!error && response.statusCode == 200) {
                
                resolve(response)
            }
            if (error) {
                reject(response)
            }
        });
    })
}

function getData(data) {

    let newData = [];

    const defaults = {
        flags: 'w',
        encoding: 'utf8',
        fd: null,
        mode: 0o666,
        autoClose: true
    };
    const writer = file.createWriteStream(__dirname + '/article.json', defaults);


    for (let i = 0; i < data.length; i++) {
        let ele = data[i];
        let content = "";
        let imgName = /[^/\\\\]+$/.exec(ele.image_url)[0];
        let dirName = imgName.split('.')[0];
        mkdirp(__dirname + '/' + dirName)

        // var fs = file.createWriteStream(__dirname+'/'+dirName+'/'+imgName);
        request(ele.image_url)
            .pipe(file.createWriteStream(__dirname + '/' + dirName + '/' + imgName))



        superagent.get(ele.product_url).set(
            {
                'Accept': " text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': ' zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Cookie': '__permanent_id=20171031142819310368736992098274442; dest_area=country_id%3D9000%26province_id%3D111%26city_id%20%3D0%26district_id%3D0%26town_id%3D0; _jzqco=%7C%7C%7C%7C%7C1.741543986.1509431316213.1509431352165.1509431356793.1509431352165.1509431356793.0.0.0.4.4; MDD_permanent_id=20180308172237761661818428583225164; MDD_province_str=%E5%B9%BF%E4%B8%9C; MDD_province_id=144; MDD_city_str=%E6%B7%B1%E5%9C%B3%E5%B8%82; MDD_city_id=7; MDD_area_str=%E5%85%B6%E4%BB%96%E5%8C%BA%E5%8E%BF; MDD_area_id=1440299; ddscreen=2; MDD_sid=5eeea0da06eac7b38395b08b4ee14d14; __rpm=%7Cflexible%20155238...1521704717342; MDD_producthistoryids=60597132%257C61872286%257C1057985386%257C1112115256',
                'Host': 'search.m.dangdang.com',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': 1,
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
                'proxy': "39.134.68.25"
            }
        ).end(function (err, res) {
            // 抛错拦截
            if (err) {
                throw Error(err);
            }
            /**
            * res.text 包含未解析前的响应内容
            * 我们通过cheerio的load方法解析整个文档，就是html页面所有内容，可以通过console.log($.html());在控制台查看
            */
            let $ = cheerio.load(res.text);

            let url = $('a[dd_name="顶部详情"]')[0].attribs.href;

            superagent.get(url).set({
                'Accept': " text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': ' zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Cookie': '__permanent_id=20171031142819310368736992098274442; dest_area=country_id%3D9000%26province_id%3D111%26city_id%20%3D0%26district_id%3D0%26town_id%3D0; _jzqco=%7C%7C%7C%7C%7C1.741543986.1509431316213.1509431352165.1509431356793.1509431352165.1509431356793.0.0.0.4.4; MDD_permanent_id=20180308172237761661818428583225164; MDD_province_str=%E5%B9%BF%E4%B8%9C; MDD_province_id=144; MDD_city_str=%E6%B7%B1%E5%9C%B3%E5%B8%82; MDD_city_id=7; MDD_area_str=%E5%85%B6%E4%BB%96%E5%8C%BA%E5%8E%BF; MDD_area_id=1440299; ddscreen=2; MDD_sid=5eeea0da06eac7b38395b08b4ee14d14; __rpm=%7Cflexible%20155238...1521704717342; MDD_producthistoryids=60597132%257C61872286%257C1057985386%257C1112115256',
                'Host': 'search.m.dangdang.com',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': 1,
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
                'proxy': "39.134.68.25"

            }).end(function (err, res) {
                // 抛错拦截
                if (err) {
                    throw Error(err);
                }
                /**
                * res.text 包含未解析前的响应内容
                * 我们通过cheerio的load方法解析整个文档，就是html页面所有内容，可以通过console.log($.html());在控制台查看
                */
                let $ = cheerio.load(res.text);
                content = $(".right_content").html();
                let imgs = $(".right_content img");
                mkdirp(__dirname + '/' + dirName + '/content');
                for (let j = 0; j < imgs.length; j++) {
                    let newImageName = /[^/\\\\]+$/.exec(imgs[j].attribs.src)[0];
                    request(imgs[j].attribs.src)
                        .pipe(file.createWriteStream(__dirname + '/' + dirName + '/content/' + newImageName))

                }
                //这里定义你想拿的数据
                newData.push({
                    name: ele.name,
                    price: ele.price,
                    url: ele.image_url,
                    content: content
                })

                if (i == data.length - 1) {

                    writer.write(JSON.stringify(
                        newData
                    ))
                    writer.end()
                }
            });
        });

    }

}

getList('玩具',2).then(res =>{console.log(res.body)});
