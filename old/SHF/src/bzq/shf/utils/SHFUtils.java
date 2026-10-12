/*
 * Created on 26/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.utils;
import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Vector;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.bind.Unmarshaller;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import bzq.mail.MailServices;
import bzq.shf.forms.ActivityForm;
import bzq.shf.model.EmployeeDataModel;
import bzq.shfiwd.SHFIWD;
import bzq.shfsp.request.SHFSPBreaks;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SHFUtils {
	
	private static Logger logger = Logger.getLogger(EmployeeDataModel.class);

	public static int getVetek(Date date) {
		return getDaysBetween(date,new Date());
	}

	public static int getMinutesBetween(Date date1, Date date2) {
		int sum = 0;
		long diff=date1.getTime()-date2.getTime();
		diff=diff<0?diff*-1:diff;
		sum=(int)diff/(1000*60);
		return sum;
	}
	
	public static long getMinutesBetweenLong(Date date1, Date date2) {
		long sum = 0;
		long diff=date1.getTime()-date2.getTime();
		diff=diff<0?diff*-1:diff;
		sum=diff/(1000*60);
		return sum;
	}
	
	public static Date getTimeCalc(Date date1, int minuts) {
		Calendar time = Calendar.getInstance();
		Date dateRes = null;
		time.setTime(date1);
		time.add(Calendar.MINUTE, minuts);
		dateRes = time.getTime();
		return dateRes;
	}	
	

	public static int getDaysBetween(Date date1, Date date2) {
		int sum = 0;
		long diff=date1.getTime()-date2.getTime();
		if(diff<0) diff*=-1;
		sum=(int)(diff/(1000*60*60*24));
		return sum;
	}

	public static String getGenderDesc(String gender) {
		char g = gender.charAt(0);
		if (g == 'm' || g == 'M') {
			return "זכר";
		} else if (g == 'f' || g == 'F') {
			return "נקבה";
		} else
			return "";

	}

	/**
	 * 
	 */
	public static Date getLastNWeekDate(int n) {
		Calendar cal = Calendar.getInstance();
		int day = cal.get(Calendar.DAY_OF_WEEK) + (n * 7) - 1;
		day *= -1;
		cal.add(Calendar.DATE, day);
		return cal.getTime();
	}
	
	/**
	 * add by Yuval 05.03.09
	 */
	public static Date getLastNWeekDate(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		int day = cal.get(Calendar.DAY_OF_WEEK)-1;
		day *= -1;
		cal.add(Calendar.DATE, day);
		cal.set(Calendar.HOUR_OF_DAY,0);
		cal.set(Calendar.MINUTE,0);
		cal.set(Calendar.SECOND,0);
		cal.set(Calendar.MILLISECOND,0);
		return cal.getTime();
	}	

	/**
	 * add by Yuval 05.03.09
	 */
	public static Date getNextNWeekDate(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		int day = cal.get(Calendar.DAY_OF_WEEK) - 7;
		day *= -1;
		day++;
		cal.add(Calendar.DATE, day);
		cal.set(Calendar.HOUR_OF_DAY,0);
		cal.set(Calendar.MINUTE,0);
		cal.set(Calendar.SECOND,0);
		cal.set(Calendar.MILLISECOND,0);
		return cal.getTime();
	}	
	/**
	 * @return
	 */
	public static Date getWeekEnd() {
		Calendar cal = Calendar.getInstance();
		int day = cal.get(Calendar.DAY_OF_WEEK);
		cal.add(Calendar.DATE, 7 - day);
		return cal.getTime();
	}

	public static boolean isEmpty(String str) {
		if (str == null || "".equals(str))
			return true;
		return false;
	}

	public static String formatDateToString(Date date, String pattern) {
		SimpleDateFormat sdf = null;
		String strDate = null;
		sdf = new SimpleDateFormat(pattern);
		if (date != null)
			strDate = sdf.format(date).toString();
		return strDate;
	}
	public static Date formatStringToDate(String str, String pattern) {
		Date date = null;
		SimpleDateFormat sdf = null;
		sdf = new SimpleDateFormat(pattern);
		try {
			date = sdf.parse(str);
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return date;
	}
	public static String replace(
		String source,
		String pattern,
		String replace) {
		if (source != null) {
			final int len = pattern.length();
			StringBuffer sb = new StringBuffer();
			int found = -1;
			int start = 0;
			while ((found = source.indexOf(pattern, start)) != -1) {
				sb.append(source.substring(start, found));
				sb.append(replace);
				start = found + len;
			}
			sb.append(source.substring(start));
			return sb.toString();
		} else
			return "";
	}
	
	public static String getParameter(String value,String defaultVal)	{
			if (isEmpty(value))
				return defaultVal;
			return value;				
	}
	
	public static String replaceNullWithEmptyString(String value)	{
		if (value==null)
			return "";
	return value;			
	}

	public static String replaceWhiteSpacesWithNbsp(String value)	{
		if (value==null)
			return "";
		return replace(value," ","&nbsp;");				
	}

	public static float parseFloat(String num,float defaultNum )	{
		if (num==null)
			return defaultNum;
		try {	
			return Float.parseFloat(num);
		} catch (Exception e)	{			
			return defaultNum;
		}						
	}
	
	public static long parseLong(String num,long defaultNum )	{
		if (num==null)
			return defaultNum;
		try {	
			return Long.parseLong(num);
		} catch (Exception e)	{			
			return defaultNum;
		}						
	}

	public static String getLengthFormat(int minutes){
		Calendar cal=Calendar.getInstance();
		cal.set(Calendar.MILLISECOND,0);
		cal.set(Calendar.SECOND,0);
		cal.set(Calendar.MINUTE,0);
		cal.set(Calendar.HOUR_OF_DAY,0);
		String pref="";
		if(minutes<0){
			pref="-";
			minutes*=-1;
		}
		cal.add(Calendar.MINUTE,minutes);
		
		Date date=cal.getTime();
		return pref+BaseConvert.dateToString(date,"HH:mm");
	}

	
	public static String getDayOfWeek(Date date){
		Calendar cal=Calendar.getInstance();
		cal.setTime(date);
		int day=cal.get(Calendar.DAY_OF_WEEK);
		String d="";
		switch(day){
				case 1:
				d="א";
				break;
			case 2:
				d="ב";
				break;
			case 3:
				d="ג";
				break;
			case 4:
				d="ד";
				break;
			case 5:
				d="ה";
				break;
			case 6:
				d="ו";
				break;
			case 7:
				d="ש";
				break;
		}
		
		return d;
	}
	
	public static boolean shfSendMail(String from, String to, String subject, String body) {
		boolean RC = true;
		// Mail
		try{
			MailServices mailServices = new MailServices();
			mailServices.setFrom(from);
			mailServices.setTo(to);
			//"הודעה ממערכת תצפ\"ית"
			mailServices.setSubject(subject);
			mailServices.setBody(body);
//			logger.info("SHFUtils.shfSendMail() - BEFORE send");
			mailServices.send();
//			logger.info("SHFUtils.shfSendMail() - AFTER send");
		} catch(Exception e)  {
			RC = false;
			logger.error("SHFUtils.shfSendMail() exception : "+e.getMessage());
		}
		return RC;
	}
	
	public static String convertDocToXMLString(Document doc) throws ShfException {
	    TransformerFactory tf = TransformerFactory.newInstance();
	    Transformer transformer;
	    try {
	        transformer = tf.newTransformer();
	        StringWriter writer = new StringWriter();
	        transformer.transform(new DOMSource(doc), new StreamResult(writer));
	        String output = writer.getBuffer().toString();
	        return output;
	    } catch (TransformerException e) {
//			e.printStackTrace();
	    	throw new ShfException("Error in convertDocToXMLString() : " + e.getMessage());
	    }	    
	}
	
	/**
	 * Function to break down url params (i.e. multiple selection for switch shifts)
	 * @param url
	 * @return Vector
	 */
	public static java.util.Vector urlToParamMap(String url) {
		if (url == null || url.length()==0) return null;
		
		java.util.Vector<java.util.Map> paramMapVec = new Vector<java.util.Map>();
		Map<String, String> paramMap = null;
		String[] candidatesArrUrl = url.split(";");
		String[] candidatesArrUrlTmp1 = null;
		String[] candidatesArrUrlTmp2 = null;
		
		for (int i=0; i<candidatesArrUrl.length; i++) {
			if(candidatesArrUrl[i] != null && candidatesArrUrl[i].length() > 0){
				candidatesArrUrlTmp1 = candidatesArrUrl[i].split("&");
				paramMap = new HashMap<String, String>();
				for (int j=0; j<candidatesArrUrlTmp1.length; j++) {
					candidatesArrUrlTmp2 = candidatesArrUrlTmp1[j].split("=");
					paramMap.put(candidatesArrUrlTmp2[0], candidatesArrUrlTmp2[1]);
				}
				paramMapVec.add(paramMap);
			}
		}
		return paramMapVec;
	}
	
	/**
	 * Function to populate paramMap with given Bean (fully qualified name), 
	 * Dates should be in format "dd/MM/yyyy-HH:mm"
	 * @param beanName
	 * @param result
	 * @param paramMapVec
	 * @return given Vector populated with given bean
	 * @throws Exception
	 */
	public static java.util.Vector populateParamMap(String beanName, Vector result, Vector<Map> paramMapVec) throws Exception {
		
		if (beanName == null || result == null || paramMapVec == null) {
			throw new Exception("error in populateParamMap(), parameters passed are invalid");
		}
		// try to populate
		for (Map map : paramMapVec) {
			
			// try to load the class
			Class myClass = Class.forName(beanName);
			Object myObj = myClass.newInstance();
			
			Iterator<HashMap> iter = map.entrySet().iterator();
			while (iter.hasNext()) {
				Map.Entry<String, String> pair = (Map.Entry<String, String>)iter.next();
				String methodName = "set"+pair.getKey().substring(0,1).toUpperCase() + pair.getKey().substring(1);
				
				Class[] paramString = new Class[1];
				paramString[0] = String.class;
				
				Class[] paramInt = new Class[1];
				paramInt[0] = int.class; 
				
				Class[] paramDate = new Class[1];
				paramDate[0] = Date.class;
				
				java.lang.reflect.Method method = null;
				try {
					method = myClass.getMethod(methodName, paramString);
					method.invoke(myObj, pair.getValue());
				}catch (NoSuchMethodException e) {
					try {
						method = myClass.getMethod(methodName, paramInt);
						method.invoke(myObj, Integer.valueOf(pair.getValue()));
					} catch (NoSuchMethodException e2) {
						try {
							method = myClass.getMethod(methodName, paramDate);
							method.invoke(myObj, SHFUtils.formatStringToDate(pair.getValue(), "dd/MM/yyyy-HH:mm"));
						} catch (NoSuchMethodException e3) {
							throw new Exception("error in populateParamMap(), could not find appropriate setter method for method '"+methodName+"' :"+e3.getMessage());
						}
					}
				}
			}
			
			result.add(myObj);
		}
		
		return result;
	}
	
	public static String retrieveAttributeValue(Document document, String xpath ) throws XPathExpressionException  {
	    XPath xPath = XPathFactory.newInstance().newXPath();
	    XPathExpression xPathExpression = xPath.compile(xpath);
	    String attributeValue = "" + xPathExpression.evaluate(document, XPathConstants.STRING);
	    return attributeValue;
	}
	
	public static void setSHFSPMessageDefaults(SHFSPBreaks breakObject) {
		breakObject.setInterfaceId("00001");
		breakObject.setApplicationId("SHF");
		breakObject.setUser("str1234");
		breakObject.setPassword("str1234");		
	}
	
	public static void setSHFIWDMessageDefaults(SHFIWD breakObject) {
		breakObject.setApplicationId("SHF");
		breakObject.setUser("000000000");
		//breakObject.setService("IWD_PELE_LOMDA");		// 2.2019 update according to business units, demand from Erez Taieb
		breakObject.setLang("HEB");
		breakObject.setIsTaskReturn("0");
		breakObject.setHighTask("0");		
	}
	
	public static String objToXmlString (Object rootElementObj, String jaxbContextPath) throws JAXBException {
		StringWriter sw = new StringWriter();
		
		JAXBContext jaxbContext = JAXBContext.newInstance(jaxbContextPath);
		Marshaller marshaller = jaxbContext.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FRAGMENT, Boolean.TRUE);
		
		marshaller.marshal(rootElementObj, sw);
		
		return sw.toString();
		
	}
	
	public static Object XmlStringToObj (String xmlString, Object obj) throws JAXBException {
		
		JAXBContext jaxbContext = JAXBContext.newInstance(obj.getClass());
		Unmarshaller unMarshaller = jaxbContext.createUnmarshaller();
		StringReader reader = new StringReader(xmlString);
		
		return unMarshaller.unmarshal(reader);
		
	}
	
	public static boolean validateXmlStringAgainstXSD (String xmlString, File xsdFile) throws SAXException, IOException {
		
		boolean result = false;
		
	    SchemaFactory factory = SchemaFactory.newInstance("http://www.w3.org/2001/XMLSchema");
	        Schema schema = factory.newSchema(xsdFile);
	        Validator validator = schema.newValidator();
	        
	        try {
	        	validator.validate(new StreamSource(new StringReader(xmlString)));
	        	result = true;
	        } catch (SAXException e) {
	        	logger.error("XML string is not valid");
	        }
	        return result;
	}
	
	public static String stringArrJoin(String[] arr, String separator){
		if (arr == null || separator == null) {
			throw new IllegalArgumentException();
		}
		if (arr.length == 1) {
			return arr[0];
		}
		
	    StringBuilder sb = new StringBuilder();
	    sb.append(arr[0]);
	    
	    for (int i = 1; i < arr.length; i++) {
	        if (i < arr.length)
	            sb.append(separator);
	        sb.append(arr[i]);
	    }
	    return sb.toString();
	}

}
