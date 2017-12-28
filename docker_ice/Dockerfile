FROM dandanwu/nginx_node8
MAINTAINER  dandanwu <danwbj@163.com> 
#拷贝大屏端静态资源
COPY ./screen/dist /home/screen
#拷贝手机端静态资源
COPY ./mobile/dist /home/mobile
#覆盖nginx配置
COPY nginx/nginx.conf /etc/nginx/
COPY nginx/default.conf /etc/nginx/conf.d/
#暴露80端口
EXPOSE 80
#拷贝服务端websocket代码
COPY ./server /home/server
#讲工作目录指定到/home/server（cd /home/server）
WORKDIR /home/server
#安装服务端依赖
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org && ln -s /usr/local/node-v8.9.1-linux-x64/lib/node_modules/cnpm/bin/cnpm /usr/local/bin/cnpm && cnpm install
#启动nginx以及服务端项目
CMD nginx && npm start
