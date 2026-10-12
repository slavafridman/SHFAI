package bzq.shf.utils;

import javax.jms.Destination;
import javax.jms.JMSException;
import javax.jms.MessageProducer;
import javax.jms.Queue;
import javax.jms.QueueConnection;
import javax.jms.QueueConnectionFactory;
import javax.jms.QueueSession;
import javax.jms.Session;
import javax.jms.TextMessage;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;

import org.apache.log4j.Logger;

/**
 * 
 * @author 31180049
 *
 */
public class TibcoQueueMessageSender {
	private static Logger logger = Logger.getLogger(TibcoQueueMessageSender.class);
	
	private Context ctx = null;
	private QueueConnectionFactory factory = null;
	private QueueConnection connection = null;
	private QueueSession session = null;
	private MessageProducer msgProducer = null;
	private Destination destination = null;
	private TextMessage msg = null;
	
	/**
	 * 
	 * @param queueJNDIName
	 * @throws IllegalArgumentException
	 * @throws NamingException
	 * @throws JMSException
	 */
	public TibcoQueueMessageSender (String queueJNDIName) throws IllegalArgumentException, NamingException, JMSException {
		
		if (queueJNDIName == null || queueJNDIName.length() == 0) {
			throw new IllegalArgumentException("Object "+this.getClass().getName()+" could not been instantiated due to illegal parameter supplied to constructor");
		}
		init(queueJNDIName);
	}
	
	private void init (String queueJNDIName) throws NamingException, JMSException {
		
		ctx = new InitialContext();
		factory = (QueueConnectionFactory) ctx.lookup(SHFConstants.SHF_JMS_QCF_JNDI_NAME);
		connection = factory.createQueueConnection();
		session = connection.createQueueSession(false, Session.AUTO_ACKNOWLEDGE);
		destination = (Queue) ctx.lookup(queueJNDIName);
		msgProducer = session.createProducer(destination);
		msg = session.createTextMessage();
		ctx.close();
	}
	
	/**
	 * Sends String message to TIBCO Queue.
	 * Note : The message is not checked in any way, validation process must take place before sending message using this method.
	 * @param message String
	 * @throws JMSException
	 * @throws IllegalArgumentException
	 */
	public void send(String message, boolean closeAfterSend) throws JMSException, IllegalArgumentException {
		logger.debug("Starting send()");
		
		if (message == null || message.length() == 0) {
			throw new IllegalArgumentException("The supplied parameter 'message' is invalid");
		}
		
		try {
		    msg.setText(message);
		    msgProducer.send(msg);
		    logger.info("Message successfully sent to TIBCO queue : " + this.destination);
		} catch (JMSException e){
			throw e;
		} finally {
			if (closeAfterSend) {
				close();
			}
		}
	} // END Method
	
	public void close() throws JMSException {
        if (msgProducer != null ) msgProducer.close();
        if (session != null ) session.close();
        if (connection != null ) connection.close();;
	}

} // END Class
