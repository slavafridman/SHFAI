package bzq.shf.action;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

import javax.servlet.ServletException;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import bzq.action.BezeqServlet;
import bzq.utils.ResourceLoader;

public class ActionServlet extends BezeqServlet {
//	private Logger logger = Logger.getLogger(ActionServlet.class);

	public void init() throws javax.servlet.ServletException {
		super.init();
		initSHF();
	}
	
	public void initSHF() {
		getServletContext().setAttribute("appName" , "shf");
		initAddConfig();		
	}
	
	public void initAddConfig() {
		String addConfigFileName = getServletConfig().getInitParameter("additionalAppConfig");
		String configEnv = System.getProperty("BZQ_CONFIG_ENV");
		String filePath = "/WEB-INF/env/" + configEnv + "/" + addConfigFileName;
		
		File inputFile = new File(filePath);
		InputStream input = ResourceLoader.getInstance().getResourceAsStream(inputFile.getPath());
        DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder dBuilder = null;

        try {
			dBuilder = dbFactory.newDocumentBuilder();
		} catch (ParserConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

        Document addConfigDoc = null;
		try {
			addConfigDoc = dBuilder.parse(input);
		} catch (SAXException e) {
			e.printStackTrace();
//			logger.error("Error at initAddConfig() " + e.getMessage());
		} catch (IOException e) {
			e.printStackTrace();
//			logger.error("Error at initAddConfig() " + e.getMessage());
		}
		addConfigDoc.getDocumentElement().normalize();
        getServletContext().setAttribute("addConfigDoc" , addConfigDoc);
        try {
			input.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public void reload() throws IOException, ServletException  {
		super.reload();
		initSHF();
	}
	
	
}
