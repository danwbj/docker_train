#从node镜像开始构建
from node
run mkdir -p /home/service/express-mysql-docker
copy . /home/service/express-mysql-docker
#指定工作目录
workdir /home/service/express-mysql-docker
#安装npm依赖
run npm install
#暴露3000端口
expose 3000
#启动node项目
cmd npm start

