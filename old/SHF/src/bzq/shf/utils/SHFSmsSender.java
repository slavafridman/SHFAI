package bzq.shf.utils;

import java.util.Vector;

import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.Destination;
import javax.jms.JMSException;
import javax.jms.MessageProducer;
import javax.jms.Session;
import javax.jms.TextMessage;
import javax.servlet.ServletContext;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.log4j.Logger;
import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.tibco.tibjms.TibjmsConnectionFactory;
/**
 * 
 * @author 31180049 5.2016
 * 
 * Utility class to send SMS messages.
 * @param  vecTo Vector of type STRING with phone numbers. Phone numbers must have all numbers including leading zeros (ie 03, 050). Those zeroes will be automatically truncated and prefix 972 added.
 * @param message String containing message to be send to recipients defined in  "vecTo"
 * @param srvCtx  ServletContext Used to get all tibco details
 * @version 1.0
 * 
 */
public class SHFSmsSender {
	private static Logger logger = Logger.getLogger(SHFSmsSender.class);
	
	private ServletContext srvCtx = null;
	
	private String scheme = null;
	private String hostName = null;
	private String port = null;
	private String queueName = null;
	private String user = null;
	private String pass = null;
	private String account = null;	
	
	private Vector<String> vecTo = null;
	private String message = null;

	public SHFSmsSender(Vector<String> vecTo, String message, ServletContext srvCtx) throws ShfException {
		super();
		this.srvCtx = srvCtx;
		this.vecTo = vecTo;
		this.message = message;
		
		if (srvCtx != null) {
			try {
				init();
			} catch (XPathExpressionException e) {
				throw new ShfException("Error while creating SHFSmsSender object (XPathExpressionException) : " + e.getMessage());
			} catch (ShfException e) {
				throw new ShfException("Error while creating SHFSmsSender object (ShfException) : " + e.getMessage());
			}
		} else
			throw new ShfException("Unable to create SHFSmsSender object since ServletContext was not supplied");
		
	}
	
	private void init() throws ShfException, XPathExpressionException {
		Document addConfigDoc = (Document)this.srvCtx.getAttribute("addConfigDoc");
		if (addConfigDoc != null) {
			this.scheme = retrieveAttributeValue(addConfigDoc, "/app-config/shf-sms/tibco-info/@scheme");
			this.hostName = retrieveAttributeValue(addConfigDoc, "/app-config/shf-sms/tibco-info/@hostName");
			this.port = retrieveAttributeValue(addConfigDoc, "/app-config/shf-sms/tibco-info/@port");
			this.queueName = retrieveAttributeValue(addConfigDoc, "/app-config/shf-sms/tibco-info/@queueName");
			this.user = retrieveAttributeValue(addConfigDoc, "/app-config/shf-sms/sms-info/@user");
			this.pass = retrieveAttributeValue(addConfigDoc, "/app-config/shf-sms/sms-info/@pass");
			this.account = retrieveAttributeValue(addConfigDoc, "/app-config/shf-sms/sms-info/@account");
		} else 
			throw new ShfException("Unable to retrieve additional configuration file from ServletContext");
				
	}
	
	private String retrieveAttributeValue(Document document, String xpath ) throws XPathExpressionException  {
	    XPath xPath = XPathFactory.newInstance().newXPath();
	    XPathExpression xPathExpression = xPath.compile(xpath);
	    String attributeValue = "" + xPathExpression.evaluate(document, XPathConstants.STRING);
	    return attributeValue;
	}


/**
 * Method to send SMS message to TIBCO QUEUE
 * @throws ShfException
 */
	public void sendSHFSmsQueueMessage() throws ShfException {
		
		if( this.vecTo == null || this.vecTo.size() == 0 || this.message == null || this.message == ""){
			throw new ShfException("Error in sendSHFSmsQueueMessage(), invalid params");
		}
		
		logger.info("Sending SMS message to TIBCO, server : '" + this.hostName + "', queue name : '" + this.queueName+"'");
		
		ConnectionFactory factory = null;
	    Connection connection = null;
	    Session session = null;
	    MessageProducer msgProducer = null;
	    Destination destination = null;

	    try {
	    	
	        TextMessage msg;
	        
	        factory = new TibjmsConnectionFactory(this.hostName);

	        connection = factory.createConnection();

	        /* create the session */
	        session = connection.createSession(false, javax.jms.Session.AUTO_ACKNOWLEDGE);

	        /* create the destination */
	        destination = session.createQueue(this.queueName);

	        /* create the producer */
	        msgProducer = session.createProducer(null);

	        /* publish messages */
	        /* create text message */
	        msg = session.createTextMessage();
	        
	        String res = null;
	        try {
	        	res = SHFUtils.convertDocToXMLString((createSMSXMLDoc(this.vecTo, this.message)));
			} catch (ShfException e) {
				throw e;
			}
			
	        if (res != null) {
				/* set message text */
		        msg.setText(res);
			} else {
				throw new ShfException("Error while creating or converting XML document, result is NULL");
			}

	        /* publish message */
	        msgProducer.send(destination, msg);
	        logger.info("Message successfully sent");
	        
	    } catch (JMSException e) {
//	        e.printStackTrace();
	    	logger.error(e.getMessage());
	        throw new ShfException("Error in sendSHFSmsQueueMessage() : " + e.getMessage());
	    } catch (Exception e2) {
	    	logger.error(e2.getMessage());
	    	throw new ShfException("Error in sendSHFSmsQueueMessage() : " + e2.getMessage());
	    } finally {
	        /* close the connection */
	        try {
	        	if (msgProducer != null) {
	        		msgProducer.close();
				}
	        	if (session != null) {
	        		session.close();
				}
	        	if (connection != null) {
	        		connection.close();
				}
			} catch (JMSException e) {
				logger.error("Error while closing connection :", e);
			}
		}
	}
	
	public Document createSMSXMLDoc(Vector<String> to, String message) throws ShfException {
		
		DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();  
        DocumentBuilder dBuilder = null;
		try {
			dBuilder = dbf.newDocumentBuilder();
		} catch (ParserConfigurationException e) {
//			e.printStackTrace();
			throw new ShfException("Error in createSMSXMLDoc() : " + e.getMessage());
		}
        Document doc = dBuilder.newDocument();
        
        Element rootElement = doc.createElement("Palo");
        doc.appendChild(rootElement);
        
        /// HEAD ////
        Element head = doc.createElement("Head");
        rootElement.appendChild(head);
        
        Element from = doc.createElement("From");
        from.appendChild(doc.createTextNode(this.account));
        head.appendChild(from);
        
        Element app = doc.createElement("App");
        app.appendChild(doc.createTextNode("App1"));        
        Attr attrType = doc.createAttribute("Password");
        attrType.setValue(this.pass);
        app.setAttributeNode(attrType);
        Attr attrType2 = doc.createAttribute("User");
        attrType2.setValue(this.user);
        app.setAttributeNode(attrType2);        
        head.appendChild(app);
        
        Element cmd = doc.createElement("Cmd");
//        cmd.appendChild(doc.createTextNode("sendtextmt"));
        cmd.appendChild(doc.createTextNode("sendsms"));
        head.appendChild(cmd);
        
        Element confList = doc.createElement("ConfList");
        Element to1 = doc.createElement("To");
        to1.appendChild(doc.createTextNode("http://147.235.100.138/MMIS/WebServices/SmsBrokerReplaySms.asmx/SmsBrokerLog"));
        confList.appendChild(to1);        
        head.appendChild(confList);
        
        // BODY ////
        Element body = doc.createElement("Body");
        rootElement.appendChild(body);
        
        Element sender = doc.createElement("Sender");
        sender.appendChild(doc.createTextNode("037270000"));        
        body.appendChild(sender);
        
        Element content = doc.createElement("Content");
        content.appendChild(doc.createTextNode(message));        
        body.appendChild(content);
        
        Element destList = doc.createElement("DestList");
        for (String phoneNum : to) {
        	
            Element to2 = doc.createElement("To");
            to2.appendChild(doc.createTextNode("972"+phoneNum.substring(1)));
            destList.appendChild(to2);
			
		}

        body.appendChild(destList);
        
        // OPTIONAL //// (It says optional but its mandatory :) )
        Element optional = doc.createElement("Optional");
        Element msgId = doc.createElement("MsgId");
        msgId.appendChild(doc.createTextNode("34801"));
        optional.appendChild(msgId);
        Element serviceName = doc.createElement("ServiceName");
        serviceName.appendChild(doc.createTextNode("Bezeq_SHF"));
        optional.appendChild(serviceName);
        
        rootElement.appendChild(optional);
        
        return doc;
		
	}
	public ServletContext getSrvCtx() {
		return srvCtx;
	}

	public void setSrvCtx(ServletContext srvCtx) {
		this.srvCtx = srvCtx;
	}

	public Vector<String> getVecTo() {
		return vecTo;
	}

	public void setVecTo(Vector<String> vecTo) {
		this.vecTo = vecTo;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
}
