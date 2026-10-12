package com.ibm.wtp.ejb;

import com.ibm.etools.j2ee.ejb.creation.operations.*;

public class MessageDrivenBeanTemplate
{
  protected static String nl;
  public static synchronized MessageDrivenBeanTemplate create(String lineSeparator)
  {
    nl = lineSeparator;
    MessageDrivenBeanTemplate result = new MessageDrivenBeanTemplate();
    nl = null;
    return result;
  }

  public final String NL = nl == null ? (System.getProperties().getProperty("line.separator")) : nl;
  protected final String TEXT_1 = " ";
  protected final String TEXT_2 = NL + "package ";
  protected final String TEXT_3 = ";" + NL + "import javax.ejb.MessageDrivenContext;" + NL + "" + NL + "/**" + NL + " * Bean implementation class for Message-Driven Bean: ";
  protected final String TEXT_4 = NL + " *" + NL + " * @ejb.bean" + NL + " *\tname=\"";
  protected final String TEXT_5 = "\"" + NL + " *\ttransaction-type=\"";
  protected final String TEXT_6 = "\"";
  protected final String TEXT_7 = NL + " *  acknowledge-mode=\"";
  protected final String TEXT_8 = "\"";
  protected final String TEXT_9 = NL + " *  destination-type=\"";
  protected final String TEXT_10 = "\"";
  protected final String TEXT_11 = NL + " *  subscription-durability=\"";
  protected final String TEXT_12 = "\"";
  protected final String TEXT_13 = NL + " *  message-selector=\"";
  protected final String TEXT_14 = "\"";
  protected final String TEXT_15 = NL + " *  messaging-type=\"";
  protected final String TEXT_16 = "\"";
  protected final String TEXT_17 = NL + " */" + NL + "public class ";
  protected final String TEXT_18 = " ";
  protected final String TEXT_19 = "extends ";
  protected final String TEXT_20 = " ";
  protected final String TEXT_21 = "implements javax.ejb.MessageDrivenBean, ";
  protected final String TEXT_22 = " {" + NL + "\tprivate MessageDrivenContext myMessageDrivenCtx;" + NL + "\t/**" + NL + "\t * getMessageDrivenContext" + NL + "\t */" + NL + "\tpublic MessageDrivenContext getMessageDrivenContext() {" + NL + "\t\treturn myMessageDrivenCtx;" + NL + "\t}" + NL + "\t/**" + NL + "\t * setMessageDrivenContext" + NL + "\t */" + NL + "\tpublic void setMessageDrivenContext(MessageDrivenContext ctx) {" + NL + "\t\tmyMessageDrivenCtx = ctx;" + NL + "\t}" + NL + "\t/**" + NL + "\t * ejbCreate" + NL + "\t */" + NL + "\tpublic void ejbCreate() {" + NL + "\t}" + NL + "\t/**" + NL + "\t * ejbRemove" + NL + "\t */" + NL + "\tpublic void ejbRemove() {" + NL + "\t}" + NL + "\t";
  protected final String TEXT_23 = NL + "\t/**" + NL + "\t * onMessage" + NL + "\t */" + NL + "\tpublic void onMessage(javax.jms.Message msg) {" + NL + "\t}" + NL + "\t";
  protected final String TEXT_24 = NL + "}";

  public String generate(Object argument)
  {
    final StringBuffer stringBuffer = new StringBuffer();
    stringBuffer.append(TEXT_1);
     CreateMessageDrivenBeanTemplateModel model = (CreateMessageDrivenBeanTemplateModel) argument; 
    stringBuffer.append(TEXT_2);
    stringBuffer.append(model.getBeanClassPackageName());
    stringBuffer.append(TEXT_3);
    stringBuffer.append(model.getBeanName());
    stringBuffer.append(TEXT_4);
    stringBuffer.append(model.getBeanName());
    stringBuffer.append(TEXT_5);
    stringBuffer.append(model.getTransactionType());
    stringBuffer.append(TEXT_6);
     if (model.hasAcknowledgeMode()) { 
    stringBuffer.append(TEXT_7);
    stringBuffer.append(model.getAcknowledgeMode());
    stringBuffer.append(TEXT_8);
     } 
    stringBuffer.append(TEXT_9);
    stringBuffer.append(model.getDestinationType());
    stringBuffer.append(TEXT_10);
     if (model.hasSubscriptionDurability()) { 
    stringBuffer.append(TEXT_11);
    stringBuffer.append(model.getSubscriptionDurability());
    stringBuffer.append(TEXT_12);
     } 
     if (model.hasMessageSelector()) { 
    stringBuffer.append(TEXT_13);
    stringBuffer.append(model.getMessageSelector());
    stringBuffer.append(TEXT_14);
     } 
     if (!model.isJMS()) { 
    stringBuffer.append(TEXT_15);
    stringBuffer.append(model.getMessageListenerInterface());
    stringBuffer.append(TEXT_16);
     } 
    stringBuffer.append(TEXT_17);
    stringBuffer.append(model.getSimpleBeanClassName());
    stringBuffer.append(TEXT_18);
     if (!"".equals(model.getQualifiedSuperBeanClassName())) { 
    stringBuffer.append(TEXT_19);
    stringBuffer.append(model.getQualifiedSuperBeanClassName());
    stringBuffer.append(TEXT_20);
     } 
    stringBuffer.append(TEXT_21);
    stringBuffer.append(model.getMessageListenerInterface());
    stringBuffer.append(TEXT_22);
     if (model.isJMS()) { 
    stringBuffer.append(TEXT_23);
     }  
    stringBuffer.append(TEXT_24);
    return stringBuffer.toString();
  }
}
