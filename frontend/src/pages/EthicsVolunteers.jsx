// frontend/src/pages/EthicsVolunteers.jsx

import React from 'react';

const EthicsVolunteers = () => {
  const pageStyle = {
    padding: '40px',
    maxWidth: '800px',
    margin: '40px auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lineHeight: '1.8',
    color: '#333',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    direction: 'rtl', // Right-to-left for Hebrew
    textAlign: 'right', // Align text to the right for Hebrew
  };

  const headingStyle = {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '25px',
    textAlign: 'center',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '15px',
  };

  const sectionHeadingStyle = {
    fontSize: '1.6rem',
    color: '#34495e',
    marginTop: '30px',
    marginBottom: '15px',
    borderBottom: '1px dashed #cccccc',
    paddingBottom: '5px',
  };

  const paragraphStyle = {
    marginBottom: '15px',
    fontSize: '1.05rem',
  };

  const ulStyle = {
    listStyleType: 'decimal',
    marginLeft: '20px',
    marginBottom: '20px',
    fontSize: '1.05rem',
    paddingRight: '20px', // Adjust for RTL list numbers
  };

  const liStyle = {
    marginBottom: '10px',
  };

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>כללי אתיקה של מתנדבים בעמותת "מגן דבורים אדום"</h1>
      <p style={paragraphStyle}>
        עמותת  "מגן דבורים אדום"  פועלת למען הקהילה ומסייעת במקרים של נחילי דבורים הזקוקים לחילוץ. אנו רואים חשיבות עליונה בשמירה על סטנדרטים אתיים גבוהים ובמתן שירות מקצועי, אדיב ומכבד לכלל הפונים והמתנדבים. כללי אתיקה אלו נועדו להבטיח סביבת עבודה בטוחה, מקצועית ותומכת. על כל מתנדב לקרוא, להבין ולפעול על פיהם.
      </p>

      <h2 style={sectionHeadingStyle}>כללי האתיקה</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>
           המציל/ה  יעשה/תעשה כל מאמץ סביר על מנת להשאיר את נחיל הדבורים לחיות בדו-קיום במקומו (בעיקר בנחילי קבע) וייעזר/תיעזר לשם כך בחבריו/ה.
        </li>
        <li style={liStyle}>
           המציל/ה  יעשה/תעשה כל פעולה סבירה על מנת שהנחיל יועבר במקצועיות ובחמלה למקומו החדש.
        </li>
        <li style={liStyle}>
          נחיל שצריך לפנות מגזע עץ לכריתה, יעשה מאמץ לכרות את העץ עם הנחיל בתוכו ולהעבירו לחוות חופש, או למקום אחר בו אנו מאפשרים לו להמשיך לחיות בתוך הגזע המקורי.
        </li>
        <li style={liStyle}>
          ברור לכולנו כי בעת שאנו מצילים נחיל (של קבע), אנו פולשים לרקמת חייו (למקום בו הוא התנחל), הורסים את חלות הדבש ומקום גדילת הזחלים, מפזרים את חום הנחיל, גורמים לפיזור פרומון המלכה, מנתקים את הנחיל מהפרופוליס שייצר, פוגעים בתהליכי ההתפתחות (ביצים זחל, גולם), הורגים לפעמים מספר רב של דבורים, גורמים סטרס עצום (עקה) לדבורים, למלכה ולנחיל כולו. את כל זה אנו עושים בלית ברירה בכדי להציל את הנחיל.
        </li>
        <li style={liStyle}>
           אסור למכור נחיל שהוצל!  יש לתת לו זמן להשתקם ולהחלים מטראומת הניתוק של מהלך חייו הטבעי.
        </li>
        <li style={liStyle}>
           המציל/ה  ינהג/תנהג בכבוד ובחמלה כלפי הנחיל כפי שראוי לנהוג עם כל חיית בר המצויה במצוקה.
        </li>
        <li style={liStyle}>
           המציל/ה  ינהג/תנהג בתודעת שירות כלפי "המדווחים"/"הפונים", ירגיע/תרגיע אותם ויאפשר/תאפשר להם להתיידד עם הנחיל ועם הסיטואציה.
        </li>
        <li style={liStyle}>
          באחריות  המציל/ה  לדווח לרכז/ת על גמר ביצוע ההצלה "סגירת דיווח" ומידת הצלחתה.
        </li>
        <li style={liStyle}>
          קבוצת הרכזים, צוות העמותה והמצילים מהווים קבוצת למידה החותרת להתייעלות ולשיפור הידע המעשי וכן קבוצת עזרה ותמיכה בין המצילים.
        </li>
        <li style={liStyle}>
          ידוע למציל/ה שהוא/היא פועל/ת בהתנדבות מלאה כמתנדב/ת עצמאי/ת. אין כל יחסי עובד מעביד או כל יחסי מרות ו/או תלות בין העמותה והמתנדבים העצמאיים.
        </li>
        <li style={liStyle}>
          מצילים חסרי ניסיון יעברו הדרכה ו/או יתלוו למצילים ותיקים לשם התנסות ולימוד.
        </li>
        <li style={liStyle}>
          מתנדבי העמותה, המצילים והרכזים, יפגשו לפגישת תיאום ציפיות בתחילת העונה (יתקיים בזום במידה ויהיו הגבלות התכנסות).
        </li>
        <li style={liStyle}>
           אין להעביר נחילים למי שאינו רשום כמתנדב/ת ואשר לא חתם/ה על כללי האתיקה שלנו. 
        </li>
      </ul>
      <p style={paragraphStyle}>
        אנו מודים לך על מחויבותך לכללים אלו, ועל הצטרפותך למשפחת  "מגן דבורים אדום" . בזכותך/ך, נוכל להמשיך לסייע לקהילה ולדבורים בישראל.
      </p>
    </div>
  );
};

export default EthicsVolunteers;