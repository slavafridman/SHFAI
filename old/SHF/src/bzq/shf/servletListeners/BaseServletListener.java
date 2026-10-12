package bzq.shf.servletListeners;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPathExpressionException;

import org.apache.log4j.Logger;
import org.apache.log4j.xml.DOMConfigurator;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import bzq.shf.utils.SHFUtils;

public class BaseServletListener implements ServletContextListener {
	
//------------------------------ Variables --------------------------------------
	private static Logger logger = Logger.getLogger(BaseServletListener.class);
	private ServletContext sCtx = null;

//------------------------------ Logic ------------------------------------------
	
	public void contextInitialized(ServletContextEvent sce) {
		
		setsCtx(sce.getServletContext());
		initLogger();

	}
	
	public void contextDestroyed(ServletContextEvent sce) {
		

	}

	private void initLogger () {
		
		String hostName = System.getenv("HOSTNAME")/*LINUX*/ == null ? System.getenv("COMPUTERNAME")/*WINDOWS*/ : System.getenv("HOSTNAME");
		System.setProperty("shfHostName",hostName);		// for privacyLogger
		
		String appConfigFileName = sCtx.getInitParameter("appConfig");
		String configEnv = System.getProperty("BZQ_CONFIG_ENV");
		String appConfigFilePath = "/WEB-INF/env/" + configEnv + "/" + appConfigFileName;
		
		File inputFile = new File(appConfigFilePath);
		InputStream input = sCtx.getResourceAsStream(inputFile.getPath());
        DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder dBuilder = null;

        try {
			dBuilder = dbFactory.newDocumentBuilder();
		} catch (ParserConfigurationException e) {
			e.printStackTrace();
		}

        Document addConfigDoc = null;
		try {
			addConfigDoc = dBuilder.parse(input);
		} catch (SAXException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		addConfigDoc.getDocumentElement().normalize();
		
		String loggerConfFilePath = null;
		String loggerConfFileWatch = null;
		String loggerConfFileWatchInterval = null;
		try {
			loggerConfFilePath = SHFUtils.retrieveAttributeValue(addConfigDoc, "/app-config/logger/logger-info/@name");
			loggerConfFileWatch = SHFUtils.retrieveAttributeValue(addConfigDoc, "/app-config/logger/logger-info/@watch");
			loggerConfFileWatchInterval = SHFUtils.retrieveAttributeValue(addConfigDoc, "/app-config/logger/logger-info/@watchInterval");
		} catch (XPathExpressionException e) {
			e.printStackTrace();
		}
		
		if ( loggerConfFileWatch != null && Boolean.parseBoolean(loggerConfFileWatch) && loggerConfFileWatchInterval != null) {
			DOMConfigurator.configureAndWatch(sCtx.getRealPath(loggerConfFilePath), Long.parseLong(loggerConfFileWatchInterval));
		} else {
			DOMConfigurator.configure(sCtx.getRealPath(loggerConfFilePath));
		}
	}


//------------------------------ Getters \ Setters ------------------------------
	
	public ServletContext getsCtx() {
		return sCtx;
	}

	public void setsCtx(ServletContext sCtx) {
		this.sCtx = sCtx;
	}

}
