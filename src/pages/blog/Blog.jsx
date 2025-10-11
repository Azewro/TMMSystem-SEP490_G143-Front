import React from 'react';
import './Blog.css';
import { FacebookOutlined, InstagramOutlined, TwitterOutlined } from '@ant-design/icons';

const Blog = () => {
    return (
    <div className="handmade-page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 50px',backgroundColor:'#ffff'}}>
      <div>
          <img src="/images/logo.png" style={{width:'80px',height:'80px'}}></img>
        </div>
        <div style={{display:'flex',justifyContent:'flex-start', gap:'20px'}}>
            <a href='/'><button style={{borderRadius:'10px',border:'#181717ff solid 1px'}}>Đăng nhập</button></a>
            <a href='/register'><button style={{borderRadius:'10px',background:'blue',color:'#ffff'}}>Đăng ký</button></a>
        </div>
      </div>
      <header className="header1">             
        <div className="header-content" >
          <p style={{fontSize:'15px',color:'#1a1919ff'}}>Công ty dệt may Mỹ Đức<br />Chất lượng dệt nên uy tín.<br /> Chúng tôi là đơn vị sản xuất khăn bông khăn tắm và sản phẩm dệt cao cấp đạt<br/> chuẩn quốc tế mang đến sự tin cậy cho khách hàng trong và ngoài nước.</p>
          <a href="/register"><button className="learn-more-btn" style={{borderRadius:'10px'}}>Đăng ký ngay</button></a>          
        </div>
      </header>
      <section className="about">
        <h2>Về chúng tôi</h2>
        <p>
          Công Ty TNHH Dệt May Mỹ Đức với 30 năm kinh nghiệm, là doanh nghiệp chuyên sản xuất và kinh doanh sản phẩm khăn các loại, bao gồm: Khăn quà tặng, khăn khách sạn, khăn tắm, khăn mặt, khăn baby, khăn lau,..
Với đội ngũ kỹ sư và nghệ nhân nổi tiếng giàu kinh nghiệm, cùng hệ thống máy móc, thiết bị hiện đại được nhập khẩu từ Nhật Bản, Hàn Quốc, Đài Loan. Công ty Mỹ Đức cam kết cung cấp cho quý khách hàng những sản phẩm chất lượng cao, mẫu mã đẹp, giá cả phù hợp, đáp ứng nhu cầu của người tiêu dùng trong nước và quốc tế.
Hiện nay sản phẩm của Mỹ Đức đang được phân phối qua hệ thống các đại lý, siêu thị, khách sạn, nhà nghỉ trên toàn quốc và xuất khẩu. Công ty chúng tôi có thể đáp ứng các đơn hàng lớn theo yêu cầu của Quý khách hàng.
- Một số giải thưởng đạt được: Cúp vàng doanh nhân tiêu biểu 1000 năm Thăng Long - Hà Nội, Bằng khen của hội doanh nghiệp trẻ trao tặng, Bằng khen do Ban chấp hành Đoàn Thanh Niên Hồ Chí Minh thành phố Hà Nội trao tặng, Hàng Việt Nam chất lượng cao,..

        </p>
      </section>
      <section className="products">
        <div className="left-box">
          <img src="/images/blog1.jpg" alt="Gift ideas" />
          <div className="text-box">
            <h3>Chất lượng & quy trình</h3>
            <p>Mọi sản phẩm đều trải qua quy trình kiểm định nghiêm ngặt, đạt tiêu chuẩn quốc tế. Chúng tôi áp dụng công nghệ dệt tiên tiến, đảm bảo độ bền, mềm mại và an toàn cho người sử dụng.</p>
            
          </div>
        </div>

        <div className="right-box">
          <div className="text-box">
            <h3>Giá trị & cam kết với khách hàng</h3>
            <p>Chất lượng ổn định: kiểm soát 100% nguyên liệu đầu vào.
Uy tín & đúng hẹn: luôn đảm bảo tiến độ giao hàng.
Đồng hành dài lâu: hỗ trợ kỹ thuật và phản hồi nhanh.
Hợp tác bền vững: đặt chữ “Tín” lên hàng đầu.</p>
            
          </div>
          <img src="/images/blog2.jpg" alt="Tools" />
        </div>
      </section>
      <footer className="footer">
        <div className="footer-links">
          <div>
            <h3>Địa chỉ</h3>
            <p>X.Phùng Xá,H.Mỹ Đức,<br/>Hà Nội,Việt Nam</p>
          </div>
          <div>
            <h3>Liên hệ</h3>
            <p>(024)33747655<br/>(024)33512006<br/></p>
          </div>
          <div>
            <h3>Email</h3>
            <p>detmaymyduc@gmail.com</p>
          </div>
          <div>
            <h3>Giờ làm việc</h3>
            <p>Thứ 2 - Thứ 6<br/>8:00 - 17:00<br/></p>
          </div>
        </div>
        
      </footer>
    </div>
  );
};

export default Blog;